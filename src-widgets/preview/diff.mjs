/*
 * Pixel comparison of the new stylesheets against vis-1.
 *
 *     npm run preview:diff                   (all scenarios)
 *     npm run preview:diff -- dialog switch  (only comparisons whose name contains one of the words)
 *     npm run preview:diff -- --save         (also write both crops of every difference to preview/.diff/)
 *
 * Starts the preview dev server on a port of its own and opens every scenario twice in a headless Chrome: once
 * with `?scope=metro` (everything styled by the original metro-bootstrap.css) and once with `?scope=metro-rx`
 * (metro-core.css + metro-palette.css + metro-iconFont.css). Every `[data-compare]` is screenshotted at the SAME
 * place in both loads and compared pixel by pixel - comparing the two columns side by side does not work, Chrome
 * rasterizes a large glyph slightly differently depending on where on the page it sits. Elements marked
 * `data-force="hover|active|focus"` get that pseudo class forced first.
 *
 * The first scenario loads the vis-1 scope twice. It has to come out identical, otherwise the run is not
 * deterministic and the other numbers mean nothing.
 *
 * Exit code 1 as soon as one pixel differs - so it can guard every change of metro-core.css.
 *
 * - A local Chrome or Edge is needed; `CHROME` overrides the path of the executable.
 * - Talks to Chrome over the DevTools protocol with the WebSocket built into node 22 - no puppeteer, and the PNG
 *   decoder below is enough for what Chrome writes (8 bit, RGB or RGBA, not interlaced).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4176;
const DEBUG_PORT = 9334;
const VIEWPORT = { width: 1700, height: 1200 };

/** Query strings of the page - see the URL parameters in preview.tsx */
const SCENARIOS = [
    // the vis-1 scope against itself - must be identical, otherwise the run is not deterministic
    { name: 'self-test', query: '', selfTest: true },
    { name: 'default', query: '' },
    { name: 'selected', query: 'select_on_true=true' },
    { name: 'image', query: 'image=1&icon_width=60&icon_top=10' },
    { name: 'large', query: 'size=220' },
    { name: 'small', query: 'size=96' },
    // as on a device without Segoe UI and Cambria: the shipped Open Sans and PT Serif Caption on both sides
    { name: 'fonts', query: 'bundledfonts=1' },
];

const SAVE = process.argv.includes('--save');
const only = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const SAVE_DIR = path.join(here, '.diff');

function findChrome() {
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
async function connect(url) {
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

async function waitFor(what, timeout, check) {
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

/** Decodes the PNGs Chrome produces into RGBA bytes */
function decodePng(buffer) {
    let offset = 8;
    let width = 0;
    let height = 0;
    let colorType = 0;
    const idat = [];
    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        const data = buffer.subarray(offset + 8, offset + 8 + length);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            if (data[8] !== 8 || data[12] !== 0) {
                throw new Error('Only 8 bit, not interlaced PNGs are supported');
            }
            colorType = data[9];
        } else if (type === 'IDAT') {
            idat.push(data);
        }
        offset += 12 + length;
    }
    const channels = { 2: 3, 6: 4 }[colorType];
    if (!channels) {
        throw new Error(`PNG color type ${colorType} is not supported`);
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const pixels = Buffer.alloc(width * height * 4);
    const line = Buffer.alloc(stride);
    const previous = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const source = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        for (let x = 0; x < stride; x++) {
            const left = x >= channels ? line[x - channels] : 0;
            const up = previous[x];
            const upLeft = x >= channels ? previous[x - channels] : 0;
            let value = source[x];
            if (filter === 1) {
                value += left;
            } else if (filter === 2) {
                value += up;
            } else if (filter === 3) {
                value += (left + up) >> 1;
            } else if (filter === 4) {
                const p = left + up - upLeft;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - up);
                const pc = Math.abs(p - upLeft);
                value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
            }
            line[x] = value & 0xff;
        }
        for (let x = 0; x < width; x++) {
            for (let c = 0; c < 4; c++) {
                pixels[(y * width + x) * 4 + c] = c < channels ? line[x * channels + c] : 255;
            }
        }
        line.copy(previous);
    }
    return { width, height, pixels };
}

/** Number of differing pixels and the box around them */
function compare(a, b) {
    if (a.width !== b.width || a.height !== b.height) {
        return { count: -1, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
    }
    let count = 0;
    let maxDelta = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < a.height; y++) {
        for (let x = 0; x < a.width; x++) {
            const i = (y * a.width + x) * 4;
            const delta = Math.max(
                Math.abs(a.pixels[i] - b.pixels[i]),
                Math.abs(a.pixels[i + 1] - b.pixels[i + 1]),
                Math.abs(a.pixels[i + 2] - b.pixels[i + 2]),
                Math.abs(a.pixels[i + 3] - b.pixels[i + 3]),
            );
            if (delta) {
                count++;
                maxDelta = Math.max(maxDelta, delta);
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }
    return { count, note: count ? `max delta ${maxDelta}, in x ${minX}-${maxX}, y ${minY}-${maxY}` : '' };
}

const server = await createServer({
    configFile: path.join(here, 'vite.config.mts'),
    server: { port: PORT, strictPort: true },
    // Not the cache of a running `npm run preview`: two dev servers must not share their optimized dependencies
    cacheDir: path.join(here, '.vite', 'diff'),
    logLevel: 'warn',
});
await server.listen();

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'metro-diff-'));
const chrome = spawn(
    findChrome(),
    [
        '--headless',
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        // the same font rendering for both halves is the point - no GPU raster differences between runs
        '--disable-gpu',
        '--force-color-profile=srgb',
        'about:blank',
    ],
    { stdio: 'ignore' },
);

let differing = 0;
let nondeterministic = false;
let failed = false;
try {
    const target = await waitFor('Chrome', 20000, async () => {
        const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        return targets.find(item => item.type === 'page');
    });
    const cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    const evaluate = async expression =>
        (await cdp.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

    const shoot = async box => {
        const { data } = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            clip: { ...box, scale: 1 },
            captureBeyondViewport: true,
        });
        const png = Buffer.from(data, 'base64');
        return { ...decodePng(png), png };
    };

    /** Loads the page with one scope in every column and screenshots the first column of every comparison */
    const captureAll = async query => {
        await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?${query}` });
        await waitFor(`the page (${query})`, 90000, () => evaluate('window.__previewReady === true'));

        // The end state of a state change is what counts - `.slider .complete` fades its colour for 0.3s, and a
        // screenshot in the middle of that is different every run
        await evaluate(`(() => {
            const style = document.createElement('style');
            style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
            document.head.appendChild(style);
        })()`);

        // Force the pseudo classes the fixtures ask for
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-force]' });
        for (const nodeId of nodeIds) {
            const { attributes } = await cdp.send('DOM.getAttributes', { nodeId });
            const force = attributes[attributes.indexOf('data-force') + 1];
            await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [force] });
        }
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

        const boxes = JSON.parse(
            await evaluate(`JSON.stringify([...document.querySelectorAll('[data-compare]')].map(el => {
                const r = el.querySelector('[data-side="legacy"]').getBoundingClientRect();
                return {
                    name: el.dataset.compare,
                    box: { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) },
                };
            }))`),
        ).filter(item => !only.length || only.some(word => item.name.includes(word)));

        const shots = new Map();
        for (const item of boxes) {
            shots.set(item.name, { box: item.box, ...(await shoot(item.box)) });
        }
        return shots;
    };

    for (const scenario of SCENARIOS) {
        const join = scope => [scenario.query, `scope=${scope}`].filter(Boolean).join('&');
        const legacyShots = await captureAll(join('metro'));
        const currentShots = await captureAll(join(scenario.selfTest ? 'metro' : 'metro-rx'));

        for (const [name, legacyShot] of legacyShots) {
            const currentShot = currentShots.get(name);
            const moved =
                !currentShot || Object.keys(legacyShot.box).some(key => legacyShot.box[key] !== currentShot.box[key]);
            const result = moved
                ? { count: -1, note: 'the box is not at the same place in both loads' }
                : compare(legacyShot, currentShot);
            if (result.count) {
                differing++;
                if (scenario.selfTest) {
                    nondeterministic = true;
                }
                if (SAVE && currentShot) {
                    fs.mkdirSync(SAVE_DIR, { recursive: true });
                    fs.writeFileSync(path.join(SAVE_DIR, `${scenario.name}-${name}-legacy.png`), legacyShot.png);
                    fs.writeFileSync(path.join(SAVE_DIR, `${scenario.name}-${name}-current.png`), currentShot.png);
                }
            }
            const status = result.count === 0 ? 'identical' : result.count < 0 ? 'ERROR' : `${result.count} px`;
            console.log(`${scenario.name.padEnd(9)} ${name.padEnd(18)} ${status.padEnd(10)} ${result.note}`);
        }
    }
    if (nondeterministic) {
        console.log('\nThe self-test differs: the same page renders differently twice - the other numbers mean nothing.');
    }
    cdp.close();
} catch (error) {
    failed = true;
    console.error(error);
} finally {
    chrome.kill();
    await server.close();
    console.log(failed ? '\nFAILED' : differing ? `\n${differing} comparison(s) differ` : '\nAll identical.');
    // Chrome releases its profile only after it exited - on Windows that can take longer than the second waited
    // here, and a profile left in the temp folder must not turn a passing run into a failing one
    setTimeout(() => {
        try {
            fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
        } catch {
            console.warn(`Could not remove the Chrome profile ${profile}`);
        }
        process.exit(failed || differing ? 1 : 0);
    }, 1000);
}
