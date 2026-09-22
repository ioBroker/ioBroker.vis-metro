import React, { type CSSProperties } from 'react';

import type { VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from '../Generic';
import MetroDialog, { dialogOptions, isDialogOpen } from './MetroDialog';
import { imgStyle, isTrue } from '../utils';
// the order of metro-bootstrap.css: what plain html gets, then the components, then the colours
import '../styles/metro-content.css';
import '../styles/metro-core.css';
import '../styles/metro-palette.css';

/** The direction a tile tilts to while it is pressed, see `tiltOf()` */
type Tilt = 'left' | 'right' | 'top' | 'bottom' | null;

export interface TileWidgetState extends VisRxWidgetState {
    tilt: Tilt;
    /** the dialog of a dialog tile is open */
    dialog?: boolean;
}

/**
 * Base of the metro tiles: the two outer boxes every template has, and the press effect.
 *
 * A vis-1 template consists of the widget div (`<div class="vis-widget" style="...; padding: 3px">`) and inside
 * it the `.metro` body. vis-2 embeds a template with `box-sizing: border-box` and the size of the widget, so the
 * 3px padding lies inside that size - `renderFrame()` builds the same two boxes, and a tile ends up exactly where
 * vis-2 draws the template.
 */
export default class TileWidget<
    RxData extends Record<string, any>,
    State extends TileWidgetState = TileWidgetState,
> extends Generic<RxData, State> {
    constructor(props: any) {
        super(props);
        this.state = { ...this.state, tilt: null };
    }

    /**
     * The widget div and the `.metro` body of the template.
     *
     * @param children    the content of the body
     * @param widgetStyle the inline style the template gives its widget div, apart from width and height
     * @param bodyProps   attributes of the body, e.g. the click handler that opens a dialog
     * @param widgetProps attributes of the widget div - the navigation tile has its click handler there
     */
    renderFrame(
        children: React.ReactNode,
        widgetStyle: CSSProperties = { padding: 3 },
        bodyProps: React.HTMLAttributes<HTMLDivElement> = {},
        widgetProps: React.HTMLAttributes<HTMLDivElement> = {},
    ): React.JSX.Element {
        return (
            <div
                {...widgetProps}
                style={{ boxSizing: 'border-box', width: '100%', height: '100%', ...widgetStyle }}
            >
                <div
                    {...bodyProps}
                    className={this.getRootClass()}
                    style={{ width: '100%', height: '100%', ...bodyProps.style }}
                >
                    {children}
                </div>
            </div>
        );
    }

    /**
     * `$.fn.tileTransform` of widgets/metro/js/metro.js: which way the tile tilts while it is pressed.
     *
     * The condition is taken over as it was, `(Y < h/2 || Y > h/2)` included - true everywhere but on the middle
     * line, where a press in the left or right third tilts up instead.
     */
    static tiltOf(event: React.PointerEvent<HTMLDivElement>): Tilt {
        const element = event.currentTarget;
        const box = element.getBoundingClientRect();
        const w = element.clientWidth;
        const h = element.clientHeight;
        const X = event.clientX - box.left;
        const Y = event.clientY - box.top;
        if (X < (w * 1) / 3 && (Y < (h * 1) / 2 || Y > (h * 1) / 2)) {
            return 'left';
        }
        if (X > (w * 2) / 3 && (Y < (h * 1) / 2 || Y > (h * 1) / 2)) {
            return 'right';
        }
        if (X > (w * 1) / 3 && X < (w * 2) / 3 && Y > h / 2) {
            return 'bottom';
        }
        return 'top';
    }

    /**
     * The handlers for the element with the `.tile` class. `vis.binds.metro.tile(el, data.transform)` installed
     * `tileTransform` only when the `transform` attribute was set; in the edit mode vis-2 takes the pointer anyway.
     */
    tileHandlers(): React.HTMLAttributes<HTMLDivElement> {
        if (!isTrue(this.attr('transform')) || this.state.editMode) {
            return {};
        }
        return {
            onPointerDown: e => this.setState({ tilt: TileWidget.tiltOf(e) }),
            onPointerUp: () => this.setState({ tilt: null }),
            onPointerLeave: () => this.setState({ tilt: null }),
        };
    }

    /** The class the press effect adds to the tile, if any */
    tiltClass(): string {
        return this.state.tilt ? ` tile-transform-${this.state.tilt}` : '';
    }

    /**
     * The click of a dialog tile (`tileDialog` & co. of vis-1, bound on the body). Nothing happens while another
     * dialog is open - vis-1 had one at a time - or in the edit mode, where vis-2 selects the widget instead.
     */
    openDialog = (): void => {
        if (!this.state.editMode && !isDialogOpen()) {
            this.setState({ dialog: true });
        }
    };

    /**
     * The dialog with the `dialog_*` attributes of the tile and the given content; `null` while it is closed.
     *
     * @param content      renders the content - only while the dialog is open
     * @param overrides    options the template set itself, e.g. the fixed 300x180 of the dimmer dialogs
     * @param contentStyle the inline style of `.content`
     */
    renderDialog(
        content: () => React.ReactNode,
        overrides: Partial<ReturnType<typeof dialogOptions>> = {},
        contentStyle?: CSSProperties,
    ): React.JSX.Element | null {
        if (!this.state.dialog) {
            return null;
        }
        return (
            <MetroDialog
                rootClass={this.getRootClass()}
                {...dialogOptions(name => this.attr(name))}
                {...overrides}
                contentStyle={contentStyle}
                onClose={() => this.setState({ dialog: false })}
            >
                {content()}
            </MetroDialog>
        );
    }

    /**
     * What a view dialog shows: vis-1 put an (empty) view container into the content and appended the rendered
     * view after it.
     */
    renderViewContent(view: unknown): React.ReactNode {
        return (
            <>
                <div
                    className="vis-view-container"
                    data-vis-contains={view as string}
                />
                {view ? this.getWidgetView(view as string) : null}
            </>
        );
    }

    /**
     * The optional image of a tile or badge, the way the templates wrote it:
     * `<img style="position: absolute;top:x%;..." src="..."/>`.
     */
    img(src: unknown, prefix: 'icon' | 'badge'): React.JSX.Element | null {
        if (!src) {
            return null;
        }
        return (
            <img
                src={src as string}
                alt=""
                style={imgStyle(this.state.rxData, prefix)}
            />
        );
    }
}
