/*
 * Pixel comparison of the new stylesheets against vis-1.
 *
 *     npm run preview:diff                   (all scenarios)
 *     npm run preview:diff -- dialog switch  (only comparisons whose name contains one of the words)
 *     npm run preview:diff -- --save         (also write both crops of every difference to preview/.diff/)
 *     npm run preview:diff -- --save-all     (write both crops of every comparison, to look at them)
 *
 * Starts the preview dev server on a port of its own and opens every scenario twice in a headless Chrome: once
 * with `?scope=metro` (everything styled by the original metro-bootstrap.css) and once with `?scope=metro-rx`
 * (metro-core.css + metro-palette.css + metro-iconFont.css). Every `[data-compare]` is screenshotted at the SAME
 * place in both loads and compared pixel by pixel - comparing the two columns side by side does not work, Chrome
 * rasterizes a large glyph slightly differently depending on where on the page it sits. Elements marked
 * `data-force="hover|active|focus"` get that pseudo class forced first.
 *
 * The dialog tiles are also clicked open and the whole window is compared, and the cases with `clicks` (see
 * preview/cases.tsx) are clicked in both scopes: what the vis-1 template does with the original binds of basic.html
 * and what the React widget does must be the same, write by write.
 *
 * The first scenario loads the vis-1 scope twice. It has to come out identical, otherwise the run is not
 * deterministic and the other numbers mean nothing.
 *
 * Exit code 1 as soon as one pixel differs - so it can guard every change of metro-core.css.
 *
 * - A local Chrome or Edge is needed; `CHROME` overrides the path of the executable (see browser.mjs).
 * - `PROBE='<js expression>'` evaluates the expression on every dialog page and prints the result - to find out
 *   where a difference comes from.
 * - The PNG decoder below is enough for what Chrome writes (8 bit, RGB or RGBA, not interlaced).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { startBrowser, waitFor } from './browser.mjs';

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

const SAVE_ALL = process.argv.includes('--save-all');
const SAVE = SAVE_ALL || process.argv.includes('--save');
const only = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const SAVE_DIR = path.join(here, '.diff');

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

const { cdp, evaluate, stop } = await startBrowser({ name: 'diff', port: PORT, debugPort: DEBUG_PORT, viewport: VIEWPORT });

let differing = 0;
let nondeterministic = false;
let failed = false;
try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

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
            }
            if ((result.count || SAVE_ALL) && SAVE && currentShot) {
                fs.mkdirSync(SAVE_DIR, { recursive: true });
                fs.writeFileSync(path.join(SAVE_DIR, `${scenario.name}-${name}-legacy.png`), legacyShot.png);
                fs.writeFileSync(path.join(SAVE_DIR, `${scenario.name}-${name}-current.png`), currentShot.png);
            }
            const status = result.count === 0 ? 'identical' : result.count < 0 ? 'ERROR' : `${result.count} px`;
            console.log(`${scenario.name.padEnd(9)} ${name.padEnd(18)} ${status.padEnd(10)} ${result.note}`);
        }
    }
    // The dialogs: one page per dialog tile, clicked open (`?dialog=`), compared over the whole window - the
    // dialog is centred in the window, so both loads put it at the same place
    await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/` });
    await waitFor('the page', 90000, () => evaluate('window.__previewReady === true'));
    const dialogs = JSON.parse(await evaluate('JSON.stringify(window.__dialogCases || [])')).filter(
        name => !only.length || only.some(word => name.includes(word)),
    );
    const shootWindow = async query => {
        await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?${query}` });
        await waitFor(`the dialog (${query})`, 90000, () => evaluate('window.__previewReady === true'));
        await evaluate(`(() => {
            const style = document.createElement('style');
            style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
            document.head.appendChild(style);
        })()`);
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
        if (process.env.PROBE) {
            console.log(query, await evaluate(process.env.PROBE));
        }
        return shoot({ x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height });
    };
    for (const name of dialogs) {
        const legacyShot = await shootWindow(`dialog=${name}&scope=metro`);
        const currentShot = await shootWindow(`dialog=${name}&scope=metro-rx`);
        const result = compare(legacyShot, currentShot);
        if (result.count) {
            differing++;
        }
        if ((result.count || SAVE_ALL) && SAVE) {
            fs.mkdirSync(SAVE_DIR, { recursive: true });
            fs.writeFileSync(path.join(SAVE_DIR, `dialog-${name}-legacy.png`), legacyShot.png);
            fs.writeFileSync(path.join(SAVE_DIR, `dialog-${name}-current.png`), currentShot.png);
        }
        const status = result.count === 0 ? 'identical' : `${result.count} px`;
        console.log(`${'dialog'.padEnd(9)} ${name.padEnd(18)} ${status.padEnd(10)} ${result.note}`);
    }

    // The behaviour: every case with `clicks` is loaded alone (`?click=`), clicked at the same places in both
    // scopes, and what it did is compared - the writes, URL calls and view changes, in their order
    const clickCases = JSON.parse(await evaluate('JSON.stringify(window.__clickCases || [])')).filter(
        item => !only.length || only.some(word => item.name.includes(word)),
    );
    const clickThrough = async (item, scope) => {
        await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?click=${item.name}&scope=${scope}` });
        await waitFor(`the widget (${item.name}, ${scope})`, 90000, () => evaluate('window.__previewReady === true'));
        for (const click of item.clicks) {
            const point = JSON.parse(
                await evaluate(`(() => {
                    const click = ${JSON.stringify(click)};
                    const host = document.querySelector('[data-click-host]');
                    const el = click.selector ? (click.global ? document : host).querySelector(click.selector) : host;
                    if (!el) {
                        return 'null';
                    }
                    const r = el.getBoundingClientRect();
                    // whole pixels, as a mouse delivers them
                    return JSON.stringify({
                        x: Math.round(r.left + r.width * (click.x ?? 0.5)),
                        y: Math.round(r.top + r.height * (click.y ?? 0.5)),
                    });
                })()`),
            );
            if (!point) {
                return `no element ${click.selector} to click`;
            }
            for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
                await cdp.send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 });
            }
            // the widget renders what it wrote before the next click, and a dialog fades in
            await evaluate('new Promise(resolve => setTimeout(resolve, 300))');
        }
        return evaluate('window.__clickLog()');
    };
    for (const item of clickCases) {
        const legacy = await clickThrough(item, 'metro');
        const current = await clickThrough(item, 'metro-rx');
        const same = legacy === current;
        if (!same) {
            differing++;
        }
        console.log(`${'click'.padEnd(9)} ${item.name.padEnd(22)} ${same ? 'same' : 'DIFFERENT'}  ${legacy}`);
        if (!same) {
            console.log(`${''.padEnd(43)}${current}`);
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
    await stop();
    console.log(failed ? '\nFAILED' : differing ? `\n${differing} comparison(s) differ` : '\nAll identical.');
    process.exit(failed || differing ? 1 : 0);
}
