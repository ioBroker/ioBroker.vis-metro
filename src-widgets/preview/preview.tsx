/*
 * Development page for the metro widgets.
 *
 * It renders the widgets against a stub of the vis-2 `VisRxWidget` base class, so the set can be looked at and
 * clicked without a running ioBroker. Its main job is the rewrite of src/styles/metro-core.css: every widget is
 * shown twice on the same DOM - once styled by the vis-1 metro-bootstrap.css, once by the new stylesheets - and a
 * third time as the difference of the two, which stays black wherever they agree.
 *
 * Not part of the widget set - excluded from lint and never built into `widgets/`.
 * Start with `npm run preview` in the root.
 */
import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';

// puts the stub of `window.visRxWidget` in place - before the widgets are imported below
import { withDefaults } from './stub';
import { actions as vis1Actions, loadVis1, renderVis1Widget } from './vis1';
import { FIXTURES, type Scope } from './fixtures';
import { CASES } from './cases';
import { IMAGES } from './imageSamples';
import { COLORS, RIBBED } from '../tools/palette.mjs';
import iconCss from '../public/styles/metro-iconFont.css?raw';
import openSansUrl from '../src/styles/fonts/OpenSans-Regular.woff?url';
import ptSerifUrl from '../src/styles/fonts/PTSerifCaption-Regular.woff?url';
import openSansLightUrl from '../src/styles/fonts/OpenSans-Light.woff?url';
import openSansBoldUrl from '../src/styles/fonts/OpenSans-Bold.woff?url';

const ERROR_STYLE =
    'margin:24px;padding:16px;background:#fde7e9;color:#8b1a1a;border-radius:8px;white-space:pre-wrap;font:13px/1.5 monospace';

/** Shows a message in the page instead of leaving a white screen behind */
function fail(what: string, error: unknown): never {
    const details = error instanceof Error ? [error.message, error.stack || ''].join('\n\n') : String(error);
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = '';
        const pre = document.createElement('pre');
        pre.style.cssText = ERROR_STYLE;
        pre.textContent = [what, details].join('\n\n');
        root.appendChild(pre);
    }
    console.error(what, error);
    throw error;
}

// The widgets extend `window.visRxWidget`, so they may only be imported after the stub is in place
const MODULES = await Promise.all([
    import('../src/MetroTileBool'),
    import('../src/MetroTileString'),
    import('../src/MetroTileBoolNumber'),
    import('../src/MetroTileState'),
    import('../src/MetroTileStateNumber'),
    import('../src/MetroTileList8'),
    import('../src/MetroTileToggle'),
    import('../src/MetroTileToggleNumber'),
    import('../src/MetroTileNav'),
    import('../src/MetroSlider'),
    import('../src/MetroSliderVertical'),
    import('../src/MetroValueBoolCheckbox'),
    import('../src/MetroValueBoolSwitch'),
    import('../src/MetroTileBoolDialog'),
    import('../src/MetroTileDialogStatic'),
    import('../src/MetroTileStaticDialogNumber'),
    import('../src/MetroTileDialogString'),
    import('../src/MetroTileStringDialogNumber'),
    import('../src/MetroTileDialog'),
    import('../src/MetroTileDialogNumber'),
    import('../src/MetroTileFrameDialogNumber'),
    import('../src/MetroTileDimmer'),
    import('../src/MetroTileDimmerDialog'),
    import('../src/MetroTileDimmerDialogactiv'),
    import('../src/MetroTileShutter'),
    import('../src/MetroTileShutterDialog'),
    import('../src/MetroTileHeating'),
    import('../src/MetroTileHeatingDialog'),
]).catch(e => fail('The widgets could not be loaded.', e));

/** tpl id -> React widget */
const WIDGETS: Record<string, any> = Object.fromEntries(
    MODULES.map(module => [module.default.getWidgetInfo().id, module.default]),
);
const MetroTileBool = WIDGETS.tplMetroTileBool;

// ------------------------------------------------------------------------------------------------ class lists

const BG_CLASSES = Object.keys(COLORS).map(name => `bg-${name}`);
const RIBBED_CLASSES = (RIBBED as string[]).map(name => `ribbed-${name}`);
const ICON_CLASSES = [...new Set([...(iconCss as string).matchAll(/\.(icon-[\w-]+):before/g)].map(m => m[1]))];

/** Two images of the vis-1 set, to check the `icon-custom` path and the percentage placement */
const IMAGE_FALSE = 'widgets/metro/img/light_light_dim_00.png';
const IMAGE_TRUE = 'widgets/metro/img/light_light_dim_100.png';

// ------------------------------------------------------------------------------------------------- controls

const panel: CSSProperties = {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 12,
};

function Group(props: { title: string; children: React.ReactNode }): React.JSX.Element {
    return (
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b style={{ fontSize: 13 }}>{props.title}</b>
            {props.children}
        </div>
    );
}

function Row(props: { label: string; children: React.ReactNode }): React.JSX.Element {
    return (
        <label style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{props.label}</span>
            {props.children}
        </label>
    );
}

function Toggle(props: { label: string; value: boolean; onChange: (value: boolean) => void }): React.JSX.Element {
    return (
        <Row label={props.label}>
            <input
                type="checkbox"
                style={{ justifySelf: 'start' }}
                checked={props.value}
                onChange={e => props.onChange(e.target.checked)}
            />
        </Row>
    );
}

function Slider(props: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}): React.JSX.Element {
    return (
        <Row label={props.label}>
            <span style={{ display: 'grid', gridTemplateColumns: '1fr 34px', gap: 6, alignItems: 'center' }}>
                <input
                    type="range"
                    min={props.min}
                    max={props.max}
                    value={props.value}
                    onChange={e => props.onChange(parseInt(e.target.value, 10))}
                />
                <span style={{ fontSize: 12, textAlign: 'right' }}>{props.value || '-'}</span>
            </span>
        </Row>
    );
}

function Text(props: { label: string; value: string; onChange: (value: string) => void }): React.JSX.Element {
    return (
        <Row label={props.label}>
            <input
                value={props.value}
                onChange={e => props.onChange(e.target.value)}
            />
        </Row>
    );
}

/** A class picker with a swatch that is drawn by the real stylesheet, not by an inline colour */
function ClassPicker(props: {
    label: string;
    value: string;
    options: string[];
    swatch: 'color' | 'icon';
    onChange: (value: string) => void;
}): React.JSX.Element {
    return (
        <Row label={props.label}>
            <span style={{ display: 'grid', gridTemplateColumns: '1fr 22px', gap: 6, alignItems: 'center' }}>
                <select
                    value={props.value}
                    onChange={e => props.onChange(e.target.value)}
                    style={{ minWidth: 0 }}
                >
                    {props.options.includes(props.value) ? null : <option value={props.value}>{props.value}</option>}
                    {props.options.map(o => (
                        <option
                            key={o}
                            value={o}
                        >
                            {o}
                        </option>
                    ))}
                </select>
                <span className="metro-rx">
                    {props.swatch === 'color' ? (
                        <span
                            className={props.value}
                            style={{ display: 'block', width: 20, height: 20, border: '1px solid var(--line)' }}
                        />
                    ) : (
                        <i
                            className={props.value}
                            style={{ fontSize: 18 }}
                        />
                    )}
                </span>
            </span>
        </Row>
    );
}

// ------------------------------------------------------------------------------------------------ comparison

/**
 * The box vis-2 gives a React widget: the size of the widget, `border-box` (visBaseWidget.tsx), and the class
 * `vis-widget` (visRxWidget.tsx), which clips like the box of an EJS widget.
 */
function VisBox(props: { width: number; height: number; children: React.ReactNode }): React.JSX.Element {
    return (
        <div
            className="vis-widget"
            style={{ position: 'relative', width: props.width, height: props.height, boxSizing: 'border-box' }}
        >
            {props.children}
        </div>
    );
}

/**
 * The real vis-1 template of a widget, rendered by the vis-1 runtime of preview/vis1.ts. Rendered anew on every
 * change - the EJS templates bind to `vis.states` themselves, but a fresh render keeps the preview simple.
 */
function Vis1Widget(props: {
    tpl: string;
    data: Record<string, any>;
    values: Record<string, any>;
    width: number;
    height: number;
}): React.JSX.Element {
    const ref = React.useRef<HTMLDivElement>(null);
    const key = JSON.stringify([props.tpl, props.data, props.values, props.width, props.height]);
    useEffect(() => {
        let cancelled = false;
        void loadVis1().then(() => {
            if (!cancelled && ref.current) {
                renderVis1Widget(ref.current, props.tpl, props.data, props.values, props);
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return (
        <div
            ref={ref}
            style={{ width: props.width, height: props.height }}
        />
    );
}

/**
 * Self-test of the difference column: `?nudge=1` shifts the upper layer by one pixel, so every edge has to light
 * up. An all-black column only means "identical" if it lights up with the nudge.
 */
const NUDGE = ['1', 'true'].includes(new URLSearchParams(window.location.search).get('nudge') || '');

/**
 * `?scope=metro` or `?scope=metro-rx` renders that scope in BOTH columns. preview/diff.mjs loads every scene
 * once with each and compares the same place on the page: Chrome rasterizes large glyphs slightly differently
 * depending on where they sit, so two columns side by side are never pixel-identical, not even with the same
 * stylesheet.
 */
const FORCED_SCOPE = new URLSearchParams(window.location.search).get('scope') as Scope | null;
const LEGACY: Scope = FORCED_SCOPE || 'metro';
const CURRENT: Scope = FORCED_SCOPE || 'metro-rx';

/** Room around every rendering, so a hover outline or the border of a selected tile is inside the screenshot */
const MARGIN = 8;

/**
 * One rendering. It is also the containing block of `position: fixed` (the transform does that), so a dialog
 * stays inside its box instead of covering the page. preview/diff.mjs screenshots exactly this element.
 */
function Side(props: {
    side: 'legacy' | 'current';
    width: number;
    height: number;
    contain?: boolean;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div
            data-side={props.side}
            style={{
                width: props.width,
                height: props.height,
                padding: MARGIN,
                position: 'relative',
                transform: 'translate(0, 0)',
                overflow: props.contain ? 'hidden' : undefined,
            }}
        >
            {props.children}
        </div>
    );
}

/**
 * The same markup three times: under the vis-1 scope, under the vis-2 scope, and both stacked with
 * `mix-blend-mode: difference` - identical pixels cancel out to black, everything that differs lights up.
 */
function Compare(props: {
    name: string;
    label: React.ReactNode;
    width: number;
    height: number;
    contain?: boolean;
    render: (scope: Scope) => React.ReactNode;
}): React.JSX.Element {
    const box = { width: props.width, height: props.height, contain: props.contain };
    const layer: CSSProperties = { position: 'absolute', inset: 0 };
    return (
        <div
            data-compare={props.name}
            style={{ display: 'contents' }}
        >
            <div style={{ fontSize: 12, alignSelf: 'center' }}>{props.label}</div>
            <Side
                side="legacy"
                {...box}
            >
                {props.render(LEGACY)}
            </Side>
            <Side
                side="current"
                {...box}
            >
                {props.render(CURRENT)}
            </Side>
            <div
                style={{
                    width: props.width + 2 * MARGIN,
                    height: props.height + 2 * MARGIN,
                    position: 'relative',
                    isolation: 'isolate',
                    background: '#000',
                }}
            >
                <div style={layer}>
                    <Side
                        side="legacy"
                        {...box}
                    >
                        {props.render(LEGACY)}
                    </Side>
                </div>
                <div style={{ ...layer, mixBlendMode: 'difference', left: NUDGE ? 1 : 0 }}>
                    <Side
                        side="current"
                        {...box}
                    >
                        {props.render(CURRENT)}
                    </Side>
                </div>
            </div>
        </div>
    );
}

function Caption(props: { children: React.ReactNode }): React.JSX.Element {
    return <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>{props.children}</div>;
}

/** The header of a comparison table: label column plus the three renderings */
function CompareGrid(props: { columns: number; children: React.ReactNode }): React.JSX.Element {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `minmax(90px, auto) repeat(3, ${props.columns + 2 * MARGIN}px)`,
                gap: 20,
                alignItems: 'start',
                overflowX: 'auto',
            }}
        >
            <div />
            <Caption>vis-1 · metro-bootstrap.css</Caption>
            <Caption>vis-2 · metro-core.css</Caption>
            <Caption>difference</Caption>
            {props.children}
        </div>
    );
}

// ------------------------------------------------------------------------------------------------------ app

type IconTarget = 'icon_class_false' | 'icon_class_true' | 'icon_badge_false' | 'icon_badge_true';

/**
 * The start state can come from the URL, so a particular case can be linked and screenshotted without clicking:
 * `?dark=1&size=200&image=1&select_on_true=1&bg_class_true=ribbed-red`. `dark`, `edit`, `size` and `image` set
 * the page, every other parameter is an attribute of the widget.
 */
const PARAMS = new URLSearchParams(window.location.search);
const PAGE_PARAMS = ['dark', 'edit', 'size', 'image', 'nudge', 'scope', 'bundledfonts', 'images'];

/**
 * The faces `?bundledfonts=1` points at the shipped files: each vis-1 family at its copy in widgets/metro/fonts/,
 * each vis-2 family at its copy in src/styles/fonts/.
 */
const BUNDLED_FACES: [family: string, weight: number, url: string][] = [
    ['Open Sans', 400, '/widgets/metro/fonts/OpenSans-Regular.woff'],
    ['Open Sans Light', 300, '/widgets/metro/fonts/OpenSans-Light.woff'],
    ['Open Sans Bold', 700, '/widgets/metro/fonts/OpenSans-Bold.woff'],
    ['PT Serif Caption', 400, '/widgets/metro/fonts/PTSerifCaption-Regular.woff'],
    ['vis-metro-sans', 400, openSansUrl],
    ['vis-metro-sans-light', 300, openSansLightUrl],
    ['vis-metro-sans-bold', 700, openSansBoldUrl],
    ['vis-metro-serif', 400, ptSerifUrl],
];

/**
 * `?bundledfonts=1` shows the widgets the way a device without Segoe UI and Cambria sees them (Android, Linux,
 * macOS). On Windows the `local()` sources of both stylesheets always win, so the shipped Open Sans and PT Serif
 * Caption would never be rendered here otherwise. They are the files vis-1 loaded from Google, byte for byte, so the
 * vis-1 column then shows what such a device showed with vis-1 - and the vis-1 copies and the vis-2 copies get
 * compared against each other on the way.
 */
function useBundledFonts(on: boolean): void {
    useEffect(() => {
        if (!on) {
            return undefined;
        }
        const style = document.createElement('style');
        style.textContent = BUNDLED_FACES.map(
            ([family, weight, url]) =>
                `@font-face { font-family: '${family}'; font-weight: ${weight}; src: url('${url}') format('woff'); }`,
        ).join('\n');
        // last in the head, so these faces win over the ones of both stylesheets
        document.head.appendChild(style);
        return () => style.remove();
    }, [on]);
}
const flag = (name: string): boolean => ['1', 'true'].includes(PARAMS.get(name) || '');
const URL_DATA = Object.fromEntries(
    [...PARAMS].filter(([name]) => !PAGE_PARAMS.includes(name)).map(([name, value]) => {
        if (value === 'true' || value === 'false') {
            return [name, value === 'true'];
        }
        return [name, value];
    }),
);

function App(): React.JSX.Element {
    const [dark, setDark] = useState(flag('dark'));
    const [editMode, setEditMode] = useState(flag('edit'));
    const [size, setSize] = useState(parseInt(PARAMS.get('size') || '', 10) || 136);
    const [image, setImage] = useState(flag('image'));
    const [bundledFonts, setBundledFonts] = useState(flag('bundledfonts'));
    useBundledFonts(bundledFonts);
    const [iconFilter, setIconFilter] = useState('');
    const [iconTarget, setIconTarget] = useState<IconTarget>('icon_class_true');

    // the attributes of the widget, starting with the defaults of getWidgetInfo() like a fresh widget in vis
    const [data, setData] = useState<Record<string, any>>(() =>
        withDefaults(MetroTileBool, { oid: 'test.0.bool', hover: true, ...URL_DATA }),
    );
    const set = (name: string, value: any): void => setData(old => ({ ...old, [name]: value }));

    const context = useMemo(
        () => ({
            setValue: (): void => {},
            socket: {},
            // the vis-1 stub has the same view active, see preview/vis1.ts
            activeView: 'preview',
            changeView: (): void => {},
            // vis-2 passes the theme through the context - that is what `getRootClass()` reads
            themeType: dark ? 'dark' : 'light',
        }),
        [dark],
    );

    // with "image" on, the glyphs are cleared - the vis-1 widget only centres an image under `icon-custom`
    const rxData = useMemo(
        () =>
            image
                ? { ...data, icon_false: IMAGE_FALSE, icon_true: IMAGE_TRUE, icon_class_false: '', icon_class_true: '' }
                : data,
        [data, image],
    );

    const common = { context, editMode, view: 'view', id: 'w1', refParent: { current: null } };

    const colorOptions = [...BG_CLASSES, ...RIBBED_CLASSES];
    const shownIcons = ICON_CLASSES.filter(name => name.includes(iconFilter.trim().toLowerCase()));

    return (
        <div
            style={
                {
                    '--panel': dark ? '#2b3038' : '#ffffff',
                    '--line': dark ? '#3d434d' : '#e0e0e0',
                    background: dark ? '#22262e' : '#f0f0f0',
                    color: dark ? '#dfe3e8' : '#222',
                    minHeight: '100vh',
                    display: 'grid',
                    gridTemplateColumns: '320px 1fr',
                    gap: 20,
                    padding: 20,
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, sans-serif',
                } as CSSProperties
            }
        >
            {/* ------------------------------------------------------------------ controls */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    alignSelf: 'start',
                    position: 'sticky',
                    top: 20,
                    maxHeight: 'calc(100vh - 40px)',
                    overflowY: 'auto',
                }}
            >
                <Group title="Page">
                    <Toggle
                        label="Dark theme"
                        value={dark}
                        onChange={setDark}
                    />
                    <Toggle
                        label="Edit mode"
                        value={editMode}
                        onChange={setEditMode}
                    />
                    <Slider
                        label="Widget size"
                        min={80}
                        max={280}
                        value={size}
                        onChange={setSize}
                    />
                    <Toggle
                        label="Bundled fonts"
                        value={bundledFonts}
                        onChange={setBundledFonts}
                    />
                </Group>

                <Group title="Tile">
                    <Toggle
                        label="hover"
                        value={!!data.hover}
                        onChange={v => set('hover', v)}
                    />
                    <Toggle
                        label="transform"
                        value={!!data.transform}
                        onChange={v => set('transform', v)}
                    />
                    <Toggle
                        label="select_on_true"
                        value={!!data.select_on_true}
                        onChange={v => set('select_on_true', v)}
                    />
                    <Text
                        label="label_false"
                        value={data.label_false}
                        onChange={v => set('label_false', v)}
                    />
                    <Text
                        label="label_true"
                        value={data.label_true}
                        onChange={v => set('label_true', v)}
                    />
                </Group>

                <Group title="Colours">
                    {(
                        [
                            ['bg_class_false', colorOptions],
                            ['bg_class_true', colorOptions],
                            ['brand_bg_class_false', colorOptions],
                            ['brand_bg_class_true', colorOptions],
                            ['badge_bg_class_false', BG_CLASSES],
                            ['badge_bg_class_true', BG_CLASSES],
                        ] as [string, string[]][]
                    ).map(([name, options]) => (
                        <ClassPicker
                            key={name}
                            label={name}
                            value={data[name]}
                            options={options}
                            swatch="color"
                            onChange={v => set(name, v)}
                        />
                    ))}
                </Group>

                <Group title="Icons">
                    {(['icon_class_false', 'icon_class_true', 'icon_badge_false', 'icon_badge_true'] as const).map(
                        name => (
                            <ClassPicker
                                key={name}
                                label={name}
                                value={data[name]}
                                options={ICON_CLASSES}
                                swatch="icon"
                                onChange={v => set(name, v)}
                            />
                        ),
                    )}
                    <Toggle
                        label="image, no glyph"
                        value={image}
                        onChange={setImage}
                    />
                    {image
                        ? (['icon_width', 'icon_height', 'icon_top', 'icon_left'] as const).map(name => (
                              <Slider
                                  key={name}
                                  label={name}
                                  min={0}
                                  max={100}
                                  value={parseInt(data[name], 10) || 0}
                                  onChange={v => set(name, v ? String(v) : '')}
                              />
                          ))
                        : null}
                </Group>
            </div>

            {/* ------------------------------------------------------------------ content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
                <div style={panel}>
                    <b style={{ fontSize: 13 }}>Tile Bool</b> <code style={{ fontSize: 11, opacity: 0.55 }}>tplMetroTileBool</code>
                    <div style={{ fontSize: 11, opacity: 0.65, margin: '4px 0 14px' }}>
                        Left: the vis-1 template of widgets/metro.html, rendered by the vis-1 runtime and embedded the
                        way vis-2 embeds an EJS widget. Middle: the React widget in the box vis-2 gives it. Right: both
                        on top of each other - black where they agree.
                    </div>
                    <CompareGrid columns={size}>
                        {[false, true].map(value => {
                            // every row its own object id: the states of the vis-1 runtime are global
                            const oid = `preview.bool_${value}`;
                            const values = { [`${oid}.val`]: value, [`${oid}.ack`]: true };
                            const data = { ...rxData, oid };
                            return (
                                <Compare
                                    key={String(value)}
                                    name={`tile-bool-${value}`}
                                    label={<code>{String(value)}</code>}
                                    width={size}
                                    height={size}
                                    render={scope =>
                                        scope === 'metro-rx' ? (
                                            <VisBox
                                                width={size}
                                                height={size}
                                            >
                                                <MetroTileBool
                                                    {...common}
                                                    values={values}
                                                    rxData={data}
                                                />
                                            </VisBox>
                                        ) : (
                                            <Vis1Widget
                                                tpl="tplMetroTileBool"
                                                data={data}
                                                values={values}
                                                width={size}
                                                height={size}
                                            />
                                        )
                                    }
                                />
                            );
                        })}
                    </CompareGrid>
                </div>

                {/* ------------------------------------------------------------------ widgets */}
                <div style={panel}>
                    <b style={{ fontSize: 13 }}>Widgets</b>
                    <div style={{ fontSize: 11, opacity: 0.65, margin: '4px 0 14px' }}>
                        Every React widget against its vis-1 template, with the attributes and states of
                        preview/cases.tsx - the corners of the templates, where a port goes wrong.
                    </div>
                    {CASES.map(item => {
                        const Widget = WIDGETS[item.tpl];
                        if (!Widget) {
                            return null;
                        }
                        const data = withDefaults(Widget, item.data);
                        return (
                            <div
                                key={item.name}
                                style={{ marginBottom: 12 }}
                            >
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                    {item.name} <code style={{ fontWeight: 400, opacity: 0.55 }}>{item.tpl}</code>
                                </div>
                                <CompareGrid columns={item.width}>
                                    <Compare
                                        name={item.name}
                                        label=""
                                        width={item.width}
                                        height={item.height}
                                        render={scope =>
                                            scope === 'metro-rx' ? (
                                                <VisBox
                                                    width={item.width}
                                                    height={item.height}
                                                >
                                                    <Widget
                                                        {...common}
                                                        values={item.values}
                                                        rxData={data}
                                                    />
                                                </VisBox>
                                            ) : (
                                                <Vis1Widget
                                                    tpl={item.tpl}
                                                    data={data}
                                                    values={item.values}
                                                    width={item.width}
                                                    height={item.height}
                                                />
                                            )
                                        }
                                    />
                                </CompareGrid>
                            </div>
                        );
                    })}
                </div>

                {/* ------------------------------------------------------------------ fixtures */}
                <div style={panel}>
                    <b style={{ fontSize: 13 }}>Components without a React widget yet</b>
                    <div style={{ fontSize: 11, opacity: 0.65, margin: '4px 0 14px' }}>
                        The vis-1 markup of switch, checkbox, slider, dialog and the text tiles, written down in
                        preview/fixtures.tsx the way the templates and the jQuery plugins build it. Hover and focus are
                        forced by <code>npm run preview:diff</code>; in the browser they react to the mouse.
                    </div>
                    {FIXTURES.map(fixture => (
                        <div
                            key={fixture.name}
                            style={{ marginBottom: 18 }}
                        >
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                                {fixture.title} <code style={{ fontWeight: 400, opacity: 0.55 }}>{fixture.source}</code>
                            </div>
                            <CompareGrid columns={fixture.width}>
                                <Compare
                                    name={fixture.name}
                                    label={<code style={{ fontSize: 11 }}>{fixture.name}</code>}
                                    width={fixture.width}
                                    height={fixture.height}
                                    contain={fixture.contain}
                                    render={fixture.render}
                                />
                            </CompareGrid>
                        </div>
                    ))}
                </div>

                {/* ------------------------------------------------------------------ palette */}
                <div style={panel}>
                    <b style={{ fontSize: 13 }}>Palette</b>
                    <div style={{ fontSize: 11, opacity: 0.65, margin: '4px 0 14px' }}>
                        Left half of every swatch is the vis-1 class, right half the generated one. Where they are
                        identical there is no seam. The halves are 80px wide, a multiple of the 40px stripe period,
                        so the ribbed ones line up as well.
                    </div>
                    {[
                        ['Backgrounds', BG_CLASSES],
                        ['Ribbed', RIBBED_CLASSES],
                    ].map(([title, classes]) => (
                        <div
                            key={title as string}
                            style={{ marginBottom: 16 }}
                        >
                            <Caption>
                                {title as string} ({(classes as string[]).length})
                            </Caption>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 160px)', gap: 10 }}>
                                {(classes as string[]).map(name => (
                                    <div key={name}>
                                        <div
                                            style={{ display: 'flex', height: 40, outline: '1px solid var(--line)' }}
                                        >
                                            <div className="metro">
                                                <div
                                                    className={name}
                                                    style={{ width: 80, height: 40 }}
                                                />
                                            </div>
                                            <div className="metro-rx">
                                                <div
                                                    className={name}
                                                    style={{ width: 80, height: 40 }}
                                                />
                                            </div>
                                        </div>
                                        <code style={{ fontSize: 10, opacity: 0.7 }}>{name}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ------------------------------------------------------------------ icons */}
                <div style={panel}>
                    <b style={{ fontSize: 13 }}>Icons</b>
                    <div style={{ fontSize: 11, opacity: 0.65, margin: '4px 0 10px' }}>
                        All {ICON_CLASSES.length} classes of metro-iconFont.css, drawn under <code>.metro-rx</code>.
                        A click puts the icon into the tile.
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                        <input
                            placeholder="filter, e.g. light"
                            value={iconFilter}
                            onChange={e => setIconFilter(e.target.value)}
                        />
                        <select
                            value={iconTarget}
                            onChange={e => setIconTarget(e.target.value as IconTarget)}
                        >
                            <option value="icon_class_false">into icon_class_false</option>
                            <option value="icon_class_true">into icon_class_true</option>
                            <option value="icon_badge_false">into icon_badge_false</option>
                            <option value="icon_badge_true">into icon_badge_true</option>
                        </select>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>{shownIcons.length} shown</span>
                    </div>
                    <div
                        className="metro-rx"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}
                    >
                        {shownIcons.map(name => (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                onClick={() => set(iconTarget, name)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 8px',
                                    border: '1px solid var(--line)',
                                    borderRadius: 4,
                                    background: data[iconTarget] === name ? 'rgba(67, 144, 223, 0.25)' : 'transparent',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <i
                                    className={name}
                                    style={{ fontSize: 20, width: 22 }}
                                />
                                <span
                                    style={{
                                        fontSize: 10,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {name.replace(/^icon-/, '')}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** A widget that throws while rendering must not take the whole page with it */
class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): { error: Error } {
        return { error };
    }

    render(): React.ReactNode {
        if (this.state.error) {
            return (
                <pre
                    style={{
                        margin: 24,
                        padding: 16,
                        background: '#fde7e9',
                        color: '#8b1a1a',
                        borderRadius: 8,
                        whiteSpace: 'pre-wrap',
                        font: '13px/1.5 monospace',
                    }}
                >
                    {[this.state.error.message, this.state.error.stack || ''].join('\n\n')}
                </pre>
            );
        }
        return this.props.children;
    }
}

/**
 * `?dialog=<case>`: only that dialog tile, at the top left, clicked open - in the scope of `?scope=`. The dialog
 * sits in the middle of the window, so preview/diff.mjs compares the whole window of the two loads.
 */
const DIALOG_CASE = CASES.find(item => item.name === new URLSearchParams(window.location.search).get('dialog'));

function DialogPage(props: { item: (typeof CASES)[number] }): React.JSX.Element {
    const { item } = props;
    const Widget = WIDGETS[item.tpl];
    const data = withDefaults(Widget, item.data);
    const context = { setValue: (): void => {}, socket: {}, themeType: 'light', activeView: 'preview', changeView: (): void => {} };
    return (
        <div
            data-dialog-host
            data-side="current"
            style={{ position: 'absolute', left: 20, top: 20, width: item.width, height: item.height }}
        >
            {(FORCED_SCOPE || 'metro-rx') === 'metro-rx' ? (
                <VisBox
                    width={item.width}
                    height={item.height}
                >
                    <Widget
                        context={context}
                        view="view"
                        id="w1"
                        refParent={{ current: null }}
                        values={item.values}
                        rxData={data}
                    />
                </VisBox>
            ) : (
                <Vis1Widget
                    tpl={item.tpl}
                    data={data}
                    values={item.values}
                    width={item.width}
                    height={item.height}
                />
            )}
        </div>
    );
}

(window as any).__dialogCases = CASES.filter(item => item.dialog).map(item => item.name);

/**
 * `?click=<case>`: only that widget, at the top left, with live values - what it writes comes back to it, as in a
 * running vis. preview/diff.mjs clicks it and reads `window.__clickLog()`: the writes, URL calls and view changes,
 * of the vis-1 template (the original binds of basic.html, see preview/vis1.ts) or of the React widget.
 */
const CLICK_CASE = CASES.find(item => item.name === new URLSearchParams(window.location.search).get('click'));

/** What the React widget did, in the form of `actions` of preview/vis1.ts */
const reactActions: unknown[][] = [];

function ClickPage(props: { item: (typeof CASES)[number] }): React.JSX.Element {
    const { item } = props;
    const Widget = WIDGETS[item.tpl];
    const data = useMemo(() => withDefaults(Widget, item.data), [Widget, item.data]);
    const [values, setValues] = useState<Record<string, any>>(item.values);
    const context = useMemo(
        () => ({
            setValue: (id: string, value: unknown): void => {
                reactActions.push(['setValue', id, value]);
                setValues(old => ({ ...old, [`${id}.val`]: value }));
            },
            changeView: (view: string): void => {
                reactActions.push(['changeView', view]);
            },
            socket: {},
            themeType: 'light',
            activeView: 'preview',
        }),
        [],
    );
    useEffect(() => {
        // ToggleWidget calls its URLs with fetch() - the call is what counts, not the answer. Only the calls of the
        // widget: the vis-1 runtime loads metro.html with fetch() as well.
        const original = window.fetch;
        window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            if (init?.mode !== 'no-cors') {
                return original(input, init);
            }
            reactActions.push(['httpGet', String(input)]);
            return Promise.resolve(new Response(''));
        };
        return () => {
            window.fetch = original;
        };
    }, []);
    return (
        <div
            data-click-host
            data-side="current"
            style={{ position: 'absolute', left: 20, top: 20, width: item.width, height: item.height }}
        >
            {(FORCED_SCOPE || 'metro-rx') === 'metro-rx' ? (
                <VisBox
                    width={item.width}
                    height={item.height}
                >
                    <Widget
                        context={context}
                        view="view"
                        id="w1"
                        refParent={{ current: null }}
                        values={values}
                        rxData={data}
                    />
                </VisBox>
            ) : (
                <Vis1Widget
                    tpl={item.tpl}
                    data={data}
                    values={item.values}
                    width={item.width}
                    height={item.height}
                />
            )}
        </div>
    );
}

(window as any).__clickCases = CASES.filter(item => item.clicks).map(item => ({ name: item.name, clicks: item.clicks }));
(window as any).__clickLog = (): string =>
    JSON.stringify((FORCED_SCOPE || 'metro-rx') === 'metro-rx' ? reactActions : vis1Actions);

/**
 * `?images=1`: every widget once, as the picture in the widget palette of vis-2 shows it (preview/imageSamples.tsx) - on
 * a transparent page, so preview/images.mjs can cut out each `[data-image]` as it is.
 */
const IMAGES_PAGE = flag('images');

function ImagesPage(): React.JSX.Element {
    useEffect(() => {
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
    }, []);
    const context = { setValue: (): void => {}, socket: {}, themeType: 'light', activeView: 'preview', changeView: (): void => {} };
    return (
        <div
            data-images
            style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, alignItems: 'flex-start', width: 1200 }}
        >
            {Object.keys(WIDGETS).map(tpl => {
                const Widget = WIDGETS[tpl];
                const sample = IMAGES[tpl] || { data: {}, values: {} };
                const size = Widget.getWidgetInfo().visDefaultStyle;
                const width = sample.width || size.width;
                const height = sample.height || size.height;
                return (
                    <div
                        key={tpl}
                        data-image={tpl}
                        // the page font and the clipping of vis-2, as around every rendering of the comparison
                        data-side="current"
                        style={{ width, height }}
                    >
                        <VisBox
                            width={width}
                            height={height}
                        >
                            <Widget
                                context={context}
                                view="view"
                                id={`image_${tpl}`}
                                refParent={{ current: null }}
                                values={sample.values}
                                rxData={withDefaults(Widget, sample.data)}
                            />
                        </VisBox>
                    </div>
                );
            })}
        </div>
    );
}

(window as any).__imageWidgets = IMAGES_PAGE ? Object.keys(WIDGETS) : [];

createRoot(document.getElementById('root')!).render(
    <Boundary>
        {IMAGES_PAGE ? (
            <ImagesPage />
        ) : CLICK_CASE ? (
            <ClickPage item={CLICK_CASE} />
        ) : DIALOG_CASE ? (
            <DialogPage item={DIALOG_CASE} />
        ) : (
            <App />
        )}
    </Boundary>,
);

/**
 * Tells preview/diff.mjs when a screenshot is meaningful: every stylesheet is in (the icon font one is linked by
 * `Generic` only after the first widget mounted) and both fonts are loaded.
 */
async function markReady(): Promise<void> {
    const frame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()));
    await frame();
    await frame();
    // the vis-1 widgets render once the vis-1 runtime is there; metro.js places the slider markers in a
    // setTimeout and marks the navigation tiles after 100ms
    await loadVis1();
    await new Promise(resolve => setTimeout(resolve, 300));
    if (DIALOG_CASE) {
        // the click handler of a dialog tile sits on the body of the widget, in vis-1 and here
        document.querySelector<HTMLElement>('[data-dialog-host] .metro, [data-dialog-host] .metro-rx')?.click();
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    await Promise.all(
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link =>
            link.sheet ? null : new Promise(resolve => link.addEventListener('load', resolve, { once: true })),
        ),
    );
    await Promise.all(
        ['iconFont', 'metroSysIcons', 'vis-metro-sans', 'vis-metro-serif', '"Open Sans"', '"PT Serif Caption"'].map(family =>
            document.fonts.load(`16px ${family}`),
        ),
    );
    await document.fonts.ready;
    await frame();
    (window as any).__previewReady = true;
}

void markReady();
