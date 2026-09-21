// @ts-expect-error no types
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/types-vis-2/modulefederation.vis.config';
import { readFileSync } from 'node:fs';
import topLevelAwait from 'vite-plugin-top-level-await';

// The shared modules come from @iobroker/types-vis-2, so react and the JSX runtime stay the singletons the
// vis-2 host provides instead of being bundled a second time. Passing package.json filters that list down to
// the packages this widget set really uses - MUI and emotion are deliberately not dependencies here, the
// widgets draw their own look with styles/metro-core.css.
const pack = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const config = {
    plugins: [
        federation({
            manifest: true,
            name: 'visMetroWidgets',
            filename: 'customWidgets.js',
            exposes: {
                './MetroTileBool': './src/MetroTileBool',
                './translations': './src/translations.ts',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        topLevelAwait({
            promiseExportName: '__tla',
            promiseImportName: (i: number): string => `__tla_${i}`,
        }),
        react(),
    ],
    server: {
        port: 3000,
        proxy: {
            '/_socket': 'http://localhost:8082',
            '/vis-2': 'http://localhost:8082',
            '/adapter': 'http://localhost:8082',
            '/widgets': 'http://localhost:8082/vis-2',
            '/widgets.html': 'http://localhost:8082/vis-2',
            '/web': 'http://localhost:8082',
            '/state': 'http://localhost:8082',
        },
    },
    base: './',
    resolve: {
        tsconfigPaths: true,
        // Same set as the shared modules above: the fallback copies inside the bundle must be unique too
        dedupe: ['react', 'react-dom'],
    },
    build: {
        target: 'chrome81',
        outDir: './build',
        rollupOptions: {
            output: {
                /*
                 * The `bg-*` / `ribbed-*` dropdown of the editor is built by scanning every loaded stylesheet and
                 * keeping the classes whose FILE NAME contains the filter of the attribute - `metro-` for this
                 * set (`filterFile` in src-vis/src/Attributes/Widget/WidgetField.tsx). A default vite build emits
                 * `assets/styles-<hash>.css`, which would not match, so the prefix is forced here.
                 */
                assetFileNames: (asset: { names?: string[] }): string => {
                    const name = asset.names?.[0] || '';
                    return name.endsWith('.css') ? 'assets/metro-[name]-[hash][extname]' : 'assets/[name]-[hash][extname]';
                },
            },
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};

export default config;
