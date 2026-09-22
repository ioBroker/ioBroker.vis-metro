/*
 * The pictures of the widgets:
 *
 * - public/img/prev_<tpl>.png - the picture in the widget palette of vis-2 (`visPrev`, src/info.ts);
 * - docs/img/<tpl>.png        - the same picture for the documentation, which must not reach out of docs/;
 * - docs/img/overview.png     - all widgets side by side;
 * - docs/img/dialog-*.png     - two dialogs, opened.
 *
 *     npm run preview:images
 *
 * Opens the preview with `?images=1&scope=metro-rx` - every widget once, with the samples of preview/imageSamples.tsx
 * - in a headless Chrome and saves a screenshot of each on a transparent background; the dialogs come from the
 * dialog pages of the comparison (`?dialog=`). Run it again after a change of a widget, of a sample or of the
 * styles; the pictures are committed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { startBrowser, waitFor } from './browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PALETTE_DIR = path.join(here, '..', 'public', 'img');
const DOCS_DIR = path.join(here, '..', '..', 'docs', 'img');
const PORT = 4177;
const DEBUG_PORT = 9335;
/** The dialogs of the documentation: case of preview/cases.tsx -> file */
const DIALOGS = { dimmerdialog: 'dialog-dimmer.png', heatingdialog: 'dialog-heating.png' };

const { cdp, evaluate, stop } = await startBrowser({
    name: 'images',
    port: PORT,
    debugPort: DEBUG_PORT,
    viewport: { width: 1700, height: 1200 },
});

/** Loads a page of the preview and waits until it is complete, without transitions */
async function open(query) {
    await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?${query}` });
    await waitFor(`the page ?${query}`, 90000, () => evaluate('window.__previewReady === true'));
    await evaluate(`(() => {
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
        document.head.appendChild(style);
    })()`);
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
}

/** The box of the first element that matches, on the page, with `margin` around it */
async function boxOf(selector, margin = 0) {
    return JSON.parse(
        await evaluate(`(() => {
            const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
            return JSON.stringify({
                x: Math.round(r.x + scrollX) - ${margin},
                y: Math.round(r.y + scrollY) - ${margin},
                width: Math.round(r.width) + ${2 * margin},
                height: Math.round(r.height) + ${2 * margin},
            });
        })()`),
    );
}

async function shoot(box, ...files) {
    const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { ...box, scale: 1 },
        captureBeyondViewport: true,
    });
    for (const file of files) {
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(`${path.relative(process.cwd(), file)}  ${box.width}x${box.height}`);
    }
}

let failed = false;
try {
    // transparent where the page shows through - the switch and the checkbox are not rectangular
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await open('images=1&scope=metro-rx');

    const widgets = JSON.parse(await evaluate('JSON.stringify(window.__imageWidgets)'));
    fs.mkdirSync(PALETTE_DIR, { recursive: true });
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    for (const tpl of widgets) {
        await shoot(
            await boxOf(`[data-image="${tpl}"]`),
            path.join(PALETTE_DIR, `prev_${tpl}.png`),
            path.join(DOCS_DIR, `${tpl}.png`),
        );
    }
    await shoot(await boxOf('[data-images]'), path.join(DOCS_DIR, 'overview.png'));

    for (const [name, file] of Object.entries(DIALOGS)) {
        await open(`dialog=${name}&scope=metro-rx`);
        await shoot(await boxOf('.window', 24), path.join(DOCS_DIR, file));
    }
    cdp.close();
} catch (error) {
    failed = true;
    console.error(error);
} finally {
    await stop();
    process.exit(failed ? 1 : 0);
}
