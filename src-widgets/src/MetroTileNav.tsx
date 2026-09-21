import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileNav';

/**
 * `tplMetroTileNav` - opens `nav_view`. While that view is the active one, tile, strip and badge take their
 * `..._active` colour, and with `select_current` the tile is marked as selected.
 *
 * In vis-1 `vis.binds.metro.tile` swapped the classes with jQuery 100ms after rendering and on every view change;
 * here they follow `context.activeView` directly. The result is the same class list: the normal class while the
 * view is not active, the active one (plus `selected`) while it is.
 *
 * Not offered any more: the jQuery effects of the view change (`hide_effect`, `show_effect`, their options and
 * durations, `sync`) - vis-2 changes views without them. `body-background` is kept: the page background is set on
 * a click, as before.
 */
export default class MetroTileNav extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(
            TPL,
            { width: 136, height: 136 },
            {
                drop: [
                    'sync',
                    'hide_effect',
                    'hide_duration',
                    'hide_options',
                    'show_effect',
                    'show_duration',
                    'show_options',
                ],
            },
        );
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileNav.getWidgetInfo();
    }

    /** `vis.binds.basic.navigation` */
    onNavigate = (): void => {
        const view = this.attr('nav_view');
        if (this.state.editMode || !view) {
            return;
        }
        const background = this.attr('body-background');
        if (background) {
            window.document.body.style.background = background;
        }
        this.props.context.changeView(view);
    };

    /** The class a `.vis-metro-nav` element ends up with: `data-metro-class` or `data-metro-class-active` */
    navClass(normal: string, active: string, selectable: boolean): string {
        const isActive = String(this.attr('nav_view') ?? '') === this.props.context.activeView;
        if (isActive) {
            return `${selectable && this.attr('select_current') ? ' selected' : ''} ${active ?? ''}`;
        }
        return ` ${normal ?? ''}`;
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={`vis-metro-nav tile ${this.attr('hover') ? 'hover' : ''}${this.navClass(this.attr('bg_class'), this.attr('bg_class_active'), true)}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content icon ${this.attr('icon_class') ? '' : 'icon-custom'}`}>
                    {' '}
                    {this.img(this.attr('icon_src'), 'icon')} <i className={this.attr('icon_class') ?? ''} />{' '}
                </div>
                <div
                    className={`vis-metro-nav brand${this.navClass(this.attr('brand_bg_class'), this.attr('brand_bg_class_active'), false)}`}
                >
                    {' '}
                    <span className="label fg-white">{this.attr('label') ?? ''}</span>{' '}
                    <div
                        className={`vis-metro-nav badge${this.navClass(this.attr('badge_bg_class'), this.attr('badge_bg_class_active'), false)}`}
                    >
                        {' '}
                        {this.img(this.attr('badge_src'), 'badge')} <i className={this.attr('icon_badge') ?? ''} />{' '}
                    </div>{' '}
                </div>
            </div>,
            { padding: 3 },
            {},
            { onClick: this.onNavigate },
        );
    }
}
