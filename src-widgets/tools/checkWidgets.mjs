/*
 * Checks the widget declarations against the vis-1 widget set.
 *
 * The React widgets only take over in vis-2 because they carry the SAME tpl id as the EJS templates in
 * `widgets/metro.html` - vis-2 replaces a widget type when a React widget declares the same id. And because the
 * widget data of a project is stored per attribute name, every attribute the vis-1 template offered has to exist
 * here as well, or a migrated widget silently loses that setting.
 *
 * Also checked: every template has its React widget, the widget is listed in io-package.json and exposed in
 * vite.config.ts, its default size is the size of the template, its picture for the palette exists and every
 * text of the editor is in i18n/en.json.
 *
 * Run with `npm run check-widgets` in the root, or `node tools/checkWidgets.mjs` in src-widgets.
 */
import { build } from 'vite';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(HERE, 'src');
const TMP = path.join(HERE, '.check');
/** `visPrev` is written the way vis-2 requests it; the file itself lives here */
const PREV_PREFIX = 'widgets/vis-2-widgets-metro/';
const PUBLIC = path.join(HERE, 'public');
const LEGACY_HTML = path.join(HERE, '..', 'widgets', 'metro.html');
const IO_PACKAGE = path.join(HERE, '..', 'io-package.json');
const VITE_CONFIG = path.join(HERE, 'vite.config.ts');

const WIDGETS = JSON.parse(readFileSync(IO_PACKAGE, 'utf8')).common.visWidgets.visMetroWidgets.components;

/**
 * Attributes the vis-1 template offered but never used, so the React version does not offer them either.
 * Existing values stay in the project untouched, they simply have no effect - as before.
 */
const DROPPED = {
    // the badge colour and the hiding at 0 were never read by the template
    tplMetroTileStateNumber: ['badge_bg_class', 'hide_on_0'],
    tplMetroTileToggleNumber: ['hide_on_0', 'badge_bg_class_false', 'badge_bg_class_true'],
    tplMetroTileStaticDialogNumber: ['hide_on_0'],
    tplMetroTileStringDialogNumber: ['hide_on_0'],
    tplMetroTileDialogNumber: ['hide_on_0'],
    // the view change effects of basic.navigation; vis-2 changes views itself
    tplMetroTileNav: ['sync', 'hide_effect', 'hide_duration', 'hide_options', 'show_effect', 'show_duration', 'show_options'],
    // the binding read `sliderBgColor`, and `oid-working` was never read
    tplMetroSlider: ['sliderColor', 'oid-working'],
    tplMetroSliderVertical: ['sliderColor', 'oid-working'],
    // listed but never used; `autoclose` looked for a dialog the metro dialog never had
    tplMetroTileDimmerDialogactiv: ['brand_bg_class', 'autoclose'],
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const entry = path.join(TMP, 'entry.ts');
writeFileSync(
    entry,
    `${WIDGETS.map(w => `import ${w} from '${SRC.replace(/\\/g, '/')}/${w}';`).join('\n')}
export default { ${WIDGETS.join(', ')} };
`,
);

await build({
    configFile: false,
    logLevel: 'error',
    build: {
        lib: { entry, formats: ['cjs'], fileName: () => 'bundle.cjs' },
        outDir: TMP,
        emptyOutDir: false,
        minify: false,
        rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
    },
});

// The widgets extend `window.visRxWidget`, which the vis-2 runtime provides
globalThis.window = { visRxWidget: class VisRxWidgetStub {} };

const mod = await import(pathToFileURL(path.join(TMP, 'bundle.cjs')).href);
const widgets = mod.default.default || mod.default;

const legacyHtml = readFileSync(LEGACY_HTML, 'utf8');
const viteConfig = readFileSync(VITE_CONFIG, 'utf8');

/** The block of a template, from its id to its end */
function legacyBlock(tpl) {
    const start = legacyHtml.indexOf(`id="${tpl}"`);
    return start === -1 ? null : legacyHtml.substring(start, legacyHtml.indexOf('</script>', start));
}

/** All attribute names the vis-1 template of that tpl id offered; `label(0-7)` stands for label0 ... label7 */
function legacyAttrs(block) {
    const names = new Set();
    for (const m of block.matchAll(/data-vis-attrs\d*="([^"]*)"/g)) {
        for (let part of m[1].split(';')) {
            part = part.trim();
            if (!part || part.startsWith('group.')) {
                continue;
            }
            // strip the type (`/id`, `/slider,0,10,1`, ...) and the default (`[..]`)
            const name = part.split('/')[0].replace(/\[[^\]]*]/, '');
            const range = name.match(/^(.*)\((\d+)-(\d+)\)$/);
            if (range) {
                for (let i = parseInt(range[2], 10); i <= parseInt(range[3], 10); i++) {
                    names.add(`${range[1]}${i}`);
                }
            } else if (name) {
                names.add(name);
            }
        }
    }
    return names;
}

/** The size of the widget div of the template: `style="width: 136px; height: 136px; ..."`, null if it has none */
function legacySize(block) {
    // not the preview of the vis-1 palette (`vis-widget_prev` inside data-vis-prev)
    const body = block.replace(/data-vis-prev='[^']*'/, '');
    const div = body.match(/class="vis-widget(?:\s[^"]*)?"\s+style="([^"]*)"/);
    const width = div?.[1].match(/(?:^|;)\s*width:\s*(\d+)px/);
    const height = div?.[1].match(/(?:^|;)\s*height:\s*(\d+)px/);
    return { width: width ? parseInt(width[1], 10) : null, height: height ? parseInt(height[1], 10) : null };
}

let problems = 0;
const ids = new Set();
const en = JSON.parse(readFileSync(path.join(SRC, 'i18n', 'en.json'), 'utf8'));
const missingLabels = new Set();

for (const name of WIDGETS) {
    const info = widgets[name].getWidgetInfo();
    const prefix = `${name} (${info.id})`;

    if (ids.has(info.id)) {
        console.log(`ERROR ${prefix}: duplicate tpl id`);
        problems++;
    }
    ids.add(info.id);

    if (info.visSet !== 'metro') {
        console.log(`ERROR ${prefix}: visSet is "${info.visSet}", must be "metro"`);
        problems++;
    }
    if (!viteConfig.includes(`'./${name}': './src/${name}'`)) {
        console.log(`ERROR ${prefix}: not in the exposes of vite.config.ts`);
        problems++;
    }
    const block = legacyBlock(info.id);
    if (!block) {
        console.log(`ERROR ${prefix}: no vis-1 template with this id - React would not replace anything`);
        problems++;
        continue;
    }

    // the switch and the checkbox have no size in their template - any default will do
    const size = legacySize(block);
    if (
        (size.width !== null || size.height !== null) &&
        (size.width !== info.visDefaultStyle?.width || size.height !== info.visDefaultStyle?.height)
    ) {
        console.log(
            `ERROR ${prefix}: default size ${info.visDefaultStyle?.width}x${info.visDefaultStyle?.height}, ` +
                `the template has ${size.width}x${size.height}`,
        );
        problems++;
    }

    const legacy = legacyAttrs(block);
    const own = new Set();
    const checkLabel = key => {
        if (key && !en[key]) {
            missingLabels.add(key);
        }
    };

    checkLabel(info.visWidgetLabel);
    checkLabel(info.visSetLabel);
    checkLabel(info.visHelp);

    // the picture of the palette, so a renamed or forgotten image does not leave a broken tooltip
    if (!info.visPrev?.startsWith(PREV_PREFIX)) {
        console.log(`ERROR ${prefix}: visPrev does not point into ${PREV_PREFIX}: ${info.visPrev}`);
        problems++;
    } else if (!existsSync(path.join(PUBLIC, info.visPrev.substring(PREV_PREFIX.length)))) {
        console.log(`ERROR ${prefix}: the picture ${info.visPrev} is not in public/ - npm run preview:images`);
        problems++;
    }

    for (const group of info.visAttrs) {
        checkLabel(group.label);
        for (const field of group.fields) {
            if (!field.name) {
                console.log(`ERROR ${prefix}: field without name in group ${group.name}`);
                problems++;
            }
            if (own.has(field.name)) {
                console.log(`ERROR ${prefix}: field ${field.name} twice`);
                problems++;
            }
            own.add(field.name);
            checkLabel(field.label);
            checkLabel(field.tooltip);
            if (Array.isArray(field.options) && !field.noTranslation) {
                field.options.forEach(o => checkLabel(typeof o === 'string' ? o : o.label));
            }
        }
    }

    const dropped = DROPPED[info.id] || [];
    const missing = [...legacy].filter(a => !own.has(a) && !dropped.includes(a));
    if (missing.length) {
        console.log(`ERROR ${prefix}: vis-1 attributes are gone: ${missing.join(', ')}`);
        problems += missing.length;
    }
    const stillThere = dropped.filter(a => own.has(a));
    if (stillThere.length) {
        console.log(`ERROR ${prefix}: listed as dropped, but still offered: ${stillThere.join(', ')}`);
        problems += stillThere.length;
    }
    const added = [...own].filter(a => !legacy.has(a));
    console.log(
        `OK    ${prefix}: ${info.visAttrs.length} groups, ${own.size} fields` +
            (dropped.length ? ` | dropped: ${dropped.join(', ')}` : '') +
            (added.length ? ` | new: ${added.join(', ')}` : ''),
    );
}

// every template of the vis-1 set needs its React widget, or vis-2 keeps showing the old one
for (const m of legacyHtml.matchAll(/<script id="(tpl\w+)"/g)) {
    if (!ids.has(m[1])) {
        console.log(`ERROR ${m[1]}: no React widget for this vis-1 template`);
        problems++;
    }
}

// '' is the "not set" entry of a select and needs no translation
const reallyMissing = [...missingLabels].filter(key => key !== '');
if (reallyMissing.length) {
    console.log(`\nERROR missing keys in i18n/en.json: ${reallyMissing.join(', ')}`);
    problems += reallyMissing.length;
}

rmSync(TMP, { recursive: true, force: true });
console.log(problems ? `\n${problems} problem(s)` : `\nall ${WIDGETS.length} widget declarations fine`);
process.exit(problems ? 1 : 0);
