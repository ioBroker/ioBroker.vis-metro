import type { VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

/**
 * Base class of every metro widget.
 *
 * `window.visRxWidget` is provided by the vis-2 runtime, so the widget set is built against the react copy of
 * the host instead of shipping its own.
 *
 * The React widgets reproduce the EJS templates of widgets/metro.html expression by expression. `attr()`, `val()`,
 * `write()` and `word()` are the counterparts of `this.data.attr()`, `vis.states.attr(oid + '.val')`,
 * `vis.setValue()` and `_()` there, so a template line and its port can be compared side by side.
 */
export default class Generic<
    RxData extends Record<string, any>,
    State extends Partial<VisRxWidgetState> = VisRxWidgetState,
> extends (window.visRxWidget as typeof VisRxWidget)<RxData, State> {
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

    /** `this.data.attr(name)` of the templates */
    attr(name: string): any {
        return (this.state.rxData as Record<string, any>)[name];
    }

    /** `vis.states.attr(oid + '.val')` - also for an unset oid, which reads `'undefined.val'` there as well */
    val(oid: unknown): any {
        return (this.state.values as Record<string, any>)[`${oid as string}.val`];
    }

    /** `vis.setValue()`. Not in the edit mode, where vis-1 bound no handlers either. */
    write(oid: string | undefined, value: unknown): void {
        if (!this.state.editMode && oid) {
            this.props.context.setValue(oid, value as ioBroker.StateValue);
        }
    }

    /** `_()` of vis-1, for the texts the templates put into the tiles ("Set temperature", "Actual" ...) */
    static word(text: string): string {
        return Generic.t(text);
    }
}
