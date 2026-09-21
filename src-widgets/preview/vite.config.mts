/*
 * Config of the local widget preview (`npm run preview` in the root).
 *
 * It is deliberately separate from `src-widgets/vite.config.ts`: no module federation, no shared modules - the
 * page brings its own react and its own stub of `window.visRxWidget`, so the widgets can be looked at without a
 * running ioBroker.
 */
import react from '@vitejs/plugin-react';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const TYPES: Record<string, string> = {
    '.js': 'text/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
};

/**
 * Serves the two widget sets under the paths vis uses, so nothing has to be built first:
 *
 *   /widgets/vis-2-widgets-metro/...  -> src-widgets/public/   (metro-iconFont.css, the fonts, the previews)
 *   /widgets/...                      -> widgets/              (the vis-1 set: metro.html, metro.js,
 *                                                               the stylesheets, the mfd images)
 *   /legacy/jquery.js, jquery-ui.js, can.js, basic-binds.js    (the vis-1 runtime, see preview/vis1.ts)
 *
 * `Generic.linkIconFont()` links `widgets/vis-2-widgets-metro/styles/metro-iconFont.css` relative to the page,
 * and the stylesheets load their fonts with `../fonts/...` - both resolve through this.
 */
function widgetFiles(): any {
    const roots: [string, string][] = [
        ['/widgets/vis-2-widgets-metro/', path.join(here, '..', 'public')],
        ['/widgets/', path.join(here, '..', '..', 'widgets')],
    ];
    // the vis-1 runtime for preview/vis1.ts - single files, so they load as classic scripts, not as modules
    const files: Record<string, string> = {
        '/legacy/jquery.js': path.join(here, '..', 'node_modules', 'jquery', 'dist', 'jquery.js'),
        '/legacy/jquery-ui.js': path.join(here, '..', 'node_modules', 'jquery-ui', 'dist', 'jquery-ui.js'),
        '/legacy/can.js': path.join(here, 'vendor', 'can.custom.min.js'),
        '/legacy/basic-binds.js': path.join(here, 'vendor', 'basic-binds.js'),
    };
    return {
        name: 'widget-files',
        configureServer(server: any): void {
            server.middlewares.use((req: any, res: any, next: () => void): void => {
                const url = decodeURIComponent((req.url || '').split('?')[0]);
                if (files[url]) {
                    res.setHeader('Content-Type', 'text/javascript');
                    fs.createReadStream(files[url]).pipe(res);
                    return;
                }
                for (const [prefix, dir] of roots) {
                    if (!url.startsWith(prefix)) {
                        continue;
                    }
                    const file = path.join(dir, url.substring(prefix.length));
                    const type = TYPES[path.extname(file).toLowerCase()];
                    if (type && file.startsWith(path.join(dir, path.sep)) && fs.existsSync(file)) {
                        res.setHeader('Content-Type', type);
                        fs.createReadStream(file).pipe(res);
                        return;
                    }
                }
                next();
            });
        },
    };
}

export default {
    root: here,
    publicDir: false,
    plugins: [
        // the preview imports the widgets with a top-level await, after the stub is on `window`
        topLevelAwait({ promiseExportName: '__tla', promiseImportName: (i: number) => `__tla_${i}` }),
        react(),
        widgetFiles(),
    ],
    build: { outDir: path.join(here, 'dist'), emptyOutDir: true, target: 'chrome100' },
    /*
     * Its own dependency cache, not the one of `src-widgets`. Two vite dev servers that share
     * `node_modules/.vite` overwrite the optimized dependencies of each other, and the page then loads without
     * any error message and stays blank.
     */
    cacheDir: path.join(here, '.vite'),
    server: {
        // 4173 is taken by the preview of vis-hqwidgets, which is often open at the same time
        port: 4174,
        // Rather fail with "Port 4174 is already in use" than quietly move to the next port - a second server on
        // the same project is exactly the case that breaks
        strictPort: true,
    },
    base: './',
};
