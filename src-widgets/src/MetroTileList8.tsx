import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import RawHtml from './Components/RawHtml';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileList8';

/**
 * `tplMetroTileList8` - one of eight looks, chosen by the integer of the state (`format(value, 10)` -> 0...7).
 * Display only.
 *
 * Kept from vis-1: the badge icon is looked up with the raw value (`icon_badge` + value), not with the integer -
 * a value of true shows `icon_badgetrue`, which does not exist.
 */
export default class MetroTileList8 extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileList8.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const value = this.val(this.attr('oid'));
        const n = metroFormat(value, 10);

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile ${this.attr('hover') ? 'hover ' : ''} ${this.attr(`bg_class${n}`) ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content icon ${this.attr(`icon_class${n}`) ? '' : 'icon-custom'}`}>
                    {' '}
                    {this.img(this.attr(`icon${n}`), 'icon')} <i className={this.attr(`icon_class${n}`) ?? ''} />{' '}
                </div>
                <div className={`brand ${this.attr(`brand_bg_class${n}`) ?? ''}`}>
                    {' '}
                    <span className="label fg-white">
                        <RawHtml html={this.attr('label_prepend')} />
                        <RawHtml html={this.attr(`label${n}`)} />
                        <RawHtml html={this.attr('label_append')} />
                    </span>{' '}
                    <div className={`badge ${this.attr(`badge_bg_class${n}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${value}`) ?? ''} />{' '}
                        {this.img(this.attr('badge_src'), 'badge')}{' '}
                    </div>{' '}
                </div>
            </div>,
        );
    }
}
