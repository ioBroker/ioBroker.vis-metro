/*
 * The vis-1 runtime, as far as the metro widget set needs it - so the preview can render the REAL vis-1 templates
 * of widgets/metro.html next to the React widgets.
 *
 * It is the same code vis-1 runs: jQuery, jQuery UI (for the `$.widget` plugins of widgets/metro/js/metro.js),
 * CanJS 2.3.25 with EJS (the very build of ioBroker.vis, vendored in preview/vendor/), metro.js, the binds of
 * metro.html and those of basic.html the templates call (vendored as well). Only `vis` itself is a stub with the
 * handful of members the templates touch.
 *
 * vis-2 renders an EJS widget the same way (`visCanWidget.tsx`): `can.view(tpl, { data, view, viewDiv, style })`,
 * then it takes the element with the widget id, positions it and sets `box-sizing: border-box` on it - see
 * `renderVis1Widget()`.
 */
declare global {
    interface Window {
        vis: any;
        can: any;
        jQuery: any;
        $: any;
        _: (word: string) => string;
        systemDictionary: Record<string, Record<string, string>>;
    }
}

/**
 * What the vis-1 widgets did - `['setValue', id, value]`, `['httpGet', url]`, `['changeView', view]` - for
 * preview/diff.mjs, which compares it with what the React widgets did on the same clicks.
 */
export const actions: unknown[][] = [];

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Cannot load ${src}`));
        document.head.appendChild(script);
    });
}

function runInline(code: string): void {
    const script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
}

/** The members of `vis` the metro templates and binds use - nothing else is there */
function installVisStub(): void {
    const { can, $ } = window;
    // `_()` of vis-1: the English text of the dictionary metro.html adds, like vis-1 in English
    window._ = (word: string): string => window.systemDictionary[word]?.en ?? word;
    window.systemDictionary = {};

    const vis = {
        editMode: false,
        activeView: 'preview',
        states: new can.Map({}),
        views: {},
        widgets: {},
        objects: {},
        navChangeCallbacks: [] as ((view: string) => void)[],
        setValue(id: string, value: unknown): void {
            actions.push(['setValue', id, value]);
            vis.states.attr({ [`${id}.val`]: value, [`${id}.ack`]: false });
        },
        // vis-1 swallows the touchstart that follows a click; there is no touch here
        detectBounce: (): boolean => false,
        preloadImages: (): void => {},
        renderView: (): void => {},
        findByName: (): false => false,
        findByRoles: (): null => null,
        // `basic.navigation` changes the view with it
        changeView(view: string): void {
            actions.push(['changeView', view]);
        },
        conn: {
            // `basic.toggle` calls a URL with it
            httpGet(url: string): void {
                actions.push(['httpGet', url]);
            },
        },
        binds: {
            // filled with the originals by preview/vendor/basic-binds.js - see loadVis1()
            basic: {},
            jqueryui: {
                // never found the metro dialog in vis-1 anyway: it waits for a jQuery-UI dialog `<wid>_dialog`
                dialogAutoClose: (): void => {},
            },
        } as Record<string, any>,
    };
    window.vis = vis;
}

let loading: Promise<void> | null = null;

/** Loads the vis-1 runtime once. The metro stylesheets are linked by index.html already. */
export function loadVis1(): Promise<void> {
    loading ||= (async () => {
        await loadScript('/legacy/jquery.js');
        await loadScript('/legacy/jquery-ui.js');
        await loadScript('/legacy/can.js');
        // jQuery animations (the slider glides to a new value in 400ms) would make every screenshot a different
        // frame - the preview compares end states
        window.jQuery.fx.off = true;
        installVisStub();
        // state, toggle, navigation and checkbox as vis-1 has them, unchanged
        await loadScript('/legacy/basic-binds.js');
        await loadScript('/widgets/metro/js/metro.js');

        const html = await (await fetch('/widgets/metro.html')).text();
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
        for (const script of doc.querySelectorAll('script')) {
            if (script.type === 'text/ejs') {
                // can.view() finds a template by the id of its <script type="text/ejs">
                document.body.appendChild(document.importNode(script, true));
            } else if (!script.src) {
                runInline(script.textContent || '');
            }
        }
    })();
    return loading;
}

let counter = 0;

/**
 * Renders one vis-1 widget into `container` the way vis-2 embeds an EJS widget: the element with the widget id
 * is positioned at the top left, gets the size of the widget and `box-sizing: border-box`.
 */
export function renderVis1Widget(
    container: HTMLElement,
    tpl: string,
    data: Record<string, any>,
    values: Record<string, any>,
    size: { width: number | string; height: number | string },
): void {
    const { vis, can } = window;
    vis.states.attr(values);
    const wid = `w${String(++counter).padStart(5, '0')}`;
    const fragment = can.view(tpl, {
        data: new can.Map({ wid, ...data }),
        view: 'preview',
        viewDiv: 'preview',
        style: {},
    });
    container.innerHTML = '';
    container.appendChild(fragment);
    const widget = container.querySelector<HTMLElement>(`#${wid}`);
    if (widget) {
        Object.assign(widget.style, {
            position: 'relative',
            left: '0',
            top: '0',
            boxSizing: 'border-box',
            width: typeof size.width === 'number' ? `${size.width}px` : size.width,
            height: typeof size.height === 'number' ? `${size.height}px` : size.height,
        });
    }
}
