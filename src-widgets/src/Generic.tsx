import type { VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

/**
 * Base class of every metro widget.
 *
 * `window.visRxWidget` is provided by the vis-2 runtime, so the widget set is built against the react copy of
 * the host instead of shipping its own.
 */
export default class Generic<
    RxData extends Record<string, any>,
    State extends Partial<VisRxWidgetState> = VisRxWidgetState,
> extends (window.visRxWidget as typeof VisRxWidget)<RxData, State> {
    /** Value of the state configured under `stateName`, e.g. `getPropertyValue('oid')` */
    getPropertyValue = (stateName: string): any => this.state.values[`${(this.state.rxData as any)[stateName]}.val`];

    /** Full state object (val/ack/lc/...) of the state configured under `stateName` */
    getProperty = (stateName: string, attr: 'val' | 'ack' | 'lc' | 'ts' | 'q'): any =>
        this.state.values[`${(this.state.rxData as any)[stateName]}.${attr}` as `${string}.val`];

    static getI18nPrefix(): string {
        return 'vis_metro_';
    }

    /**
     * Links `metro-iconFont.css`, which is shipped as a file of its own instead of being bundled.
     *
     * The icon dropdown of the editor collects the `icon-*` classes from every loaded stylesheet whose FILE NAME
     * contains `iconFont`, so the name has to survive the build - a stylesheet imported from a .tsx ends up in
     * `assets/metro-<chunk>-<hash>.css` and would no longer match. tools/extractIcons.mjs writes it to `public/`
     * for that reason, and it is linked here, once for the whole widget set.
     */
    static linkIconFont(): void {
        const href = 'widgets/vis-2-widgets-metro/styles/metro-iconFont.css';
        if (window.document.querySelector(`link[href="${href}"]`)) {
            return;
        }
        const link = window.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        window.document.head.appendChild(link);
    }

    componentDidMount(): void {
        super.componentDidMount();
        Generic.linkIconFont();
    }

    /**
     * Class of the widget root.
     *
     * `metro-rx` is the scope of styles/metro-core.css and styles/metro-palette.css. It is deliberately not
     * `metro`: vis-2 loads the vis-1 widget set as well, and both stylesheets define `.tile`, `.brand` and the
     * whole colour palette. The class names inside the scope stay the ones the vis-1 set used, because vis
     * stores them verbatim in the user's project.
     */
    getRootClass(): string {
        return this.props.context.themeType === 'dark' ? 'metro-rx metro-rx-dark' : 'metro-rx';
    }
}
