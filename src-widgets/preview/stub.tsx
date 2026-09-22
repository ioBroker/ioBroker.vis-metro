/*
 * Stub of the vis-2 runtime for the development page.
 *
 * Importing this module puts `window.visRxWidget` in place. The widgets extend it, so they may only be imported
 * afterwards - the page loads them with a dynamic `import()` after this module.
 */
import React from 'react';

import en from '../src/i18n/en.json';

class VisRxWidgetStub extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            rxData: props.rxData || {},
            rxStyle: props.rxStyle || {},
            values: props.values || {},
            editMode: !!props.editMode,
            visible: true,
        };
    }

    /** The values live in the page, not in the widget - this is what feeds them in on every change */
    static getDerivedStateFromProps(props: any, state: any): any {
        if (
            props.values !== state.values ||
            props.rxData !== state.rxData ||
            props.rxStyle !== state.rxStyle ||
            !!props.editMode !== state.editMode
        ) {
            return {
                values: props.values,
                rxData: props.rxData,
                rxStyle: props.rxStyle || {},
                editMode: !!props.editMode,
            };
        }
        return null;
    }

    static getI18nPrefix(): string {
        return '';
    }

    /** vis-2 looks the key up with the i18n prefix of the widget set; here it is English, as vis-1 shows it */
    static t(key: string): string {
        return (en as Record<string, string>)[key.replace(/^vis_metro_/, '')] ?? key;
    }

    componentDidMount(): void {}

    componentWillUnmount(): void {}

    componentDidUpdate(_prevProps: any, _prevState: any): void {}

    renderWidgetBody(_props: any): any {
        return null;
    }

    /** vis-2 renders the view here; the preview has no views, and neither has its vis-1 runtime */
    getWidgetView(_view: string): any {
        return null;
    }

    render(): React.ReactNode {
        return (this as any).renderWidgetBody({ widget: {}, style: {}, className: '', overlayClassNames: [] });
    }
}

(window as any).visRxWidget = VisRxWidgetStub;

/** Fills in the defaults of `getWidgetInfo()`, the way the vis editor does when a widget is created */
export function withDefaults(Widget: any, data: Record<string, any>): Record<string, any> {
    const info = Widget.getWidgetInfo();
    const result: Record<string, any> = {};
    for (const group of info.visAttrs) {
        for (const field of group.fields) {
            if (field.default !== undefined) {
                result[field.name] = field.default;
            }
        }
    }
    return { ...result, ...data };
}
