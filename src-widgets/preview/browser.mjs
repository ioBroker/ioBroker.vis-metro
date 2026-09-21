/*
 * What preview/diff.mjs and preview/images.mjs share: the preview dev server and a headless Chrome on it, driven
 * over the DevTools protocol with the WebSocket built into node 22 - no puppeteer.
 *
 * - A local Chrome or Edge is needed; `CHROME` overrides the path of the executable.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export function findChrome() {
    const candidates = [
        process.env.CHROME,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ];
    const found = candidates.find(file => file && fs.existsSync(file));
    if (!found) {
        throw new Error('No Chrome found - set CHROME to the path of the browser executable');
    }
    return found;
}

/** Just enough of a DevTools protocol client: send a command, get its result */
export async function connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });
    let lastId = 0;
    const pending = new Map();
    ws.onmessage = event => {
        const message = JSON.parse(event.data);
        const callbacks = message.id ? pending.get(message.id) : null;
        if (callbacks) {
            pending.delete(message.id);
            if (message.error) {
                callbacks.reject(new Error(message.error.message));
            } else {
                callbacks.resolve(message.result);
            }
        }
    };
    return {
        send: (method, params = {}) =>
            new Promise((resolve, reject) => {
                const id = ++lastId;
                pending.set(id, { resolve, reject });
                ws.send(JSON.stringify({ id, method, params }));
            }),
        close: () => ws.close(),
    };
}

export async function waitFor(what, timeout, check) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        try {
            const result = await check();
            if (result) {
                return result;
            }
        } catch {
            // not there yet
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`Timeout while waiting for ${what}`);
}

/**
 * Starts the preview dev server and a headless Chrome with one page of the given size.
 *
 * @param name     name of the tool - the dev server gets a cache of its own under preview/.vite/<name>, two dev
 *                 servers must not share their optimized dependencies
 * @returns the page (`cdp`, `evaluate`) and `stop()`, which ends both and removes the Chrome profile
 */
export async function startBrowser({ name, port, debugPort, viewport }) {
    const server = await createServer({
        configFile: path.join(here, 'vite.config.mts'),
        server: { port, strictPort: true },
        cacheDir: path.join(here, '.vite', name),
        logLevel: 'warn',
    });
    await server.listen();

    const profile = fs.mkdtempSync(path.join(os.tmpdir(), `metro-${name}-`));
    const chrome = spawn(
        findChrome(),
        [
            '--headless',
            `--remote-debugging-port=${debugPort}`,
            `--user-data-dir=${profile}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--hide-scrollbars',
            // the same font rendering in every load is the point - no GPU raster differences between runs
            '--disable-gpu',
            '--force-color-profile=srgb',
            'about:blank',
        ],
        { stdio: 'ignore' },
    );

    const stop = async () => {
        chrome.kill();
        await server.close();
        // Chrome releases its profile only after it exited - on Windows that can take longer than the second
        // waited here, and a profile left in the temp folder must not turn a passing run into a failing one
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
        } catch {
            console.warn(`Could not remove the Chrome profile ${profile}`);
        }
    };

    try {
        const target = await waitFor('Chrome', 20000, async () => {
            const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
            return targets.find(item => item.type === 'page');
        });
        const cdp = await connect(target.webSocketDebuggerUrl);
        await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
        const evaluate = async expression =>
            (await cdp.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
        return { cdp, evaluate, stop };
    } catch (error) {
        await stop();
        throw error;
    }
}
