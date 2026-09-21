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
import { legacy, withDefaults } from './stub';
import { FIXTURES, type Scope } from './fixtures';
import { COLORS, RIBBED } from '../tools/palette.mjs';
import iconCss from '../public/styles/metro-iconFont.css?raw';
import openSansUrl from '../src/styles/fonts/OpenSans-Regular.woff?url';
import ptSerifUrl from '../src/styles/fonts/PTSerifCaption-Regular.woff?url';

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
const [{ default: MetroTileBool }] = await Promise.all([import('../src/MetroTileBool')]).catch(e =>
    fail('The widgets could not be loaded.', e),
);
const LegacyTileBool = legacy(MetroTileBool);

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

/** The box vis puts around a widget: the size of the widget plus the 3px padding of the vis-1 templates */
function WidgetBox(props: { size: number; children: React.ReactNode }): React.JSX.Element {
    return <div style={{ width: props.size, height: props.size, padding: 3, position: 'relative' }}>{props.children}</div>;
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
const PAGE_PARAMS = ['dark', 'edit', 'size', 'image', 'nudge', 'scope', 'bundledfonts'];

/**
 * The faces `?bundledfonts=1` points at the shipped files: each vis-1 family at its copy in widgets/metro/fonts/,
 * each vis-2 family at its copy in src/styles/fonts/.
 */
const BUNDLED_FACES: [family: string, url: string][] = [
    ['Open Sans', '/widgets/metro/fonts/OpenSans-Regular.woff'],
    ['PT Serif Caption', '/widgets/metro/fonts/PTSerifCaption-Regular.woff'],
    ['vis-metro-sans', openSansUrl],
    ['vis-metro-serif', ptSerifUrl],
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
            ([family, url]) => `@font-face { font-family: '${family}'; font-weight: 400; src: url('${url}') format('woff'); }`,
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
    const valuesFor = (value: boolean): Record<string, any> => ({ 'test.0.bool.val': value, 'test.0.bool.ack': true });

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
                        Same DOM in all three columns. Left: the vis-1 scope <code>.metro</code> with
                        metro-bootstrap.css. Middle: the vis-2 scope <code>.metro-rx</code> with metro-core.css and
                        metro-palette.css. Right: both on top of each other - black where they agree.
                    </div>
                    <CompareGrid columns={size + 6}>
                        {[false, true].map(value => {
                            const props = { ...common, values: valuesFor(value), rxData };
                            return (
                                <Compare
                                    key={String(value)}
                                    name={`tile-bool-${value}`}
                                    label={<code>{String(value)}</code>}
                                    width={size + 6}
                                    height={size + 6}
                                    render={scope => (
                                        <WidgetBox size={size}>
                                            {scope === 'metro-rx' ? (
                                                <MetroTileBool {...props} />
                                            ) : (
                                                <LegacyTileBool {...props} />
                                            )}
                                        </WidgetBox>
                                    )}
                                />
                            );
                        })}
                    </CompareGrid>
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

createRoot(document.getElementById('root')!).render(
    <Boundary>
        <App />
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
