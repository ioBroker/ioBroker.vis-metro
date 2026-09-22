import React, { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * `$.metroDialog` of widgets/metro/js/metro.js, as a React component.
 *
 * The markup is the one the plugin built, appended to <body> like there (a portal), so it covers the page and is
 * not scaled or clipped with the view:
 *
 *   <div class="metro window-overlay">                 transparent, or rgba(0,0,0,.7) with `overlay`
 *     <div class="window [flat] [shadow]">              position: fixed, z-index 1050
 *       <div class="caption">
 *         <button class="btn-close"/>
 *         <img class="icon"/> or <span class="icon-x icon"/>
 *         <div class="title">title (html)</div>
 *       <div class="content">...</div>
 *
 * The geometry is the plugin's, quirks included, because a dialog of vis-1 must come up with the same size:
 * the window gets `width`/`height`, is centred by its outer size, and then `autoResize()` sets its size to the
 * outer size of `.content` - which is 40px lower than the window (`calc(100% - 40px)`), so a dialog of height 300
 * ends at 260 (at least the 200 of min-height).
 *
 * vis-1 had one dialog at a time; a click on another tile while one is open does nothing (`isOpen()`).
 */
interface MetroDialogProps {
    rootClass: string;
    /** html, like `.html(title)` */
    title?: string;
    /** image URL of the caption icon */
    icon?: string;
    /** or the icon class */
    iconClass?: string;
    width?: number;
    height?: number;
    overlay?: boolean;
    shadow?: boolean;
    flat?: boolean;
    draggable?: boolean;
    contentStyle?: CSSProperties;
    onClose: () => void;
    children: React.ReactNode;
}

let openDialogs = 0;

/** `$.metroDialog.opened` */
export function isDialogOpen(): boolean {
    return openDialogs > 0;
}

interface Geometry {
    top: number;
    left: number;
    width: number;
    height: number;
}

export default function MetroDialog(props: MetroDialogProps): React.JSX.Element {
    const windowRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [geometry, setGeometry] = useState<Geometry | null>(null);
    const [zIndex, setZIndex] = useState(1050);
    const [shown, setShown] = useState(false);
    const [closing, setClosing] = useState(false);
    const [dragCursor, setDragCursor] = useState(false);
    const drag = useRef<{ posX: number; posY: number; width: number; height: number } | null>(null);

    // `$.metroDialog()` followed by `autoResize()`: centre by the outer size, then take the size of the content
    useLayoutEffect(() => {
        openDialogs++;
        const win = windowRef.current;
        const content = contentRef.current;
        if (win && content) {
            const outer = win.getBoundingClientRect();
            const inner = content.getBoundingClientRect();
            const view = window.document.documentElement;
            setGeometry({
                top: (view.clientHeight - outer.height) / 2,
                left: (view.clientWidth - outer.width) / 2,
                width: inner.width,
                height: inner.height,
            });
        }
        // fadeIn('fast')
        const frame = requestAnimationFrame(() => setShown(true));
        return () => {
            cancelAnimationFrame(frame);
            openDialogs--;
        };
    }, []);

    // `$.metroDialog.close()`: fadeOut() - 400ms - and away
    const close = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setClosing(true);
        setTimeout(props.onClose, 400);
    };

    const onCaptionDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        const win = windowRef.current;
        if (!props.draggable || !win || !geometry) {
            return;
        }
        const box = win.getBoundingClientRect();
        drag.current = {
            width: box.width,
            height: box.height,
            posY: box.top + box.height - e.clientY,
            posX: box.left + box.width - e.clientX,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragCursor(true);
        // the plugin lifted the window above everything once it was dragged, and never lowered it again
        setZIndex(99999);
        e.preventDefault();
    };

    const onCaptionMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        const d = drag.current;
        if (!d || !geometry) {
            return;
        }
        const top = e.clientY > 0 ? e.clientY + d.posY - d.height : 0;
        const left = e.clientX > 0 ? e.clientX + d.posX - d.width : 0;
        const next = { ...geometry };
        if (top >= 0 && top <= window.innerHeight - d.height) {
            next.top = top;
        }
        if (left >= 0 && left <= window.innerWidth - d.width) {
            next.left = left;
        }
        setGeometry(next);
    };

    const onCaptionUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        drag.current = null;
        setDragCursor(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    const windowStyle: CSSProperties = {
        position: 'fixed',
        zIndex,
        ...(props.shadow ? { overflow: 'hidden' } : undefined),
        ...(geometry ? geometry : { width: props.width, height: props.height }),
    };

    const icon = props.icon ? (
        <img
            className="icon"
            src={props.icon}
            alt=""
        />
    ) : props.iconClass ? (
        <span className={`${props.iconClass} icon`} />
    ) : null;

    return createPortal(
        <div
            className={`${props.rootClass} window-overlay`}
            style={{
                ...(props.overlay ? { backgroundColor: 'rgba(0,0,0,.7)' } : undefined),
                opacity: shown && !closing ? 1 : 0,
                transition: `opacity ${closing ? 400 : 200}ms`,
            }}
            // the overlay is not inside the widget in vis-1; here React would hand its events up to the tile
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
        >
            <div
                ref={windowRef}
                className={`window${props.flat ? ' flat' : ''}${props.shadow ? ' shadow' : ''}`}
                style={windowStyle}
            >
                <div
                    className="caption"
                    style={props.draggable ? { cursor: dragCursor ? 'move' : 'default' } : undefined}
                    onPointerDown={onCaptionDown}
                    onPointerMove={onCaptionMove}
                    onPointerUp={onCaptionUp}
                >
                    <button
                        type="button"
                        className="btn-close"
                        onClick={close}
                    />
                    {icon}
                    <div
                        className="title"

                        dangerouslySetInnerHTML={{ __html: props.title || '' }}
                    />
                </div>
                <div
                    ref={contentRef}
                    className="content"
                    style={props.contentStyle}
                >
                    {props.children}
                </div>
            </div>
        </div>,
        window.document.body,
    );
}

/** The dialog options every dialog tile hands over, from its `dialog_*` attributes (see `tileDialog` of vis-1) */
export function dialogOptions(attr: (name: string) => any): {
    title: string;
    icon?: string;
    iconClass?: string;
    width?: number;
    height?: number;
    overlay: boolean;
    shadow: boolean;
    flat: boolean;
    draggable: boolean;
} {
    const width = parseInt(attr('dialog_width'), 10);
    const height = parseInt(attr('dialog_height'), 10);
    return {
        title: attr('dialog_title') || '',
        icon: attr('dialog_icon_src') || undefined,
        iconClass: attr('dialog_icon_class') || undefined,
        width: isNaN(width) ? undefined : width,
        height: isNaN(height) ? undefined : height,
        overlay: !!attr('dialog_modal'),
        shadow: !!attr('dialog_shadow'),
        flat: !!attr('dialog_flat'),
        draggable: !!attr('dialog_draggable'),
    };
}
