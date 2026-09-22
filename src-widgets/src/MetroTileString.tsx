import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import RawHtml from './Components/RawHtml';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileString';

/**
 * `tplMetroTileString` - the value of `content_oid` as text in the tile, the label from `label_id`; colours and
 * icons follow the boolean `state_oid`. Display only.
 */
export default class MetroTileString extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileString.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const f = metroFormat(this.val(this.attr('state_oid')));
        const selected = f === '_true' && this.attr('select_on_true') ? 'selected' : '';

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile ${this.attr('hover') ? 'hover ' : ''}${selected} ${this.attr(`bg_class${f}`) ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content fg-white icon ${this.attr(`icon_class${f}`) ? '' : 'icon-custom'}`}>
                    {' '}
                    <RawHtml html={this.attr('content_prepend')} />
                    <RawHtml html={this.val(this.attr('content_oid'))} />
                    <RawHtml html={this.attr('content_append')} /> {this.img(this.attr(`icon${f}`), 'icon')}{' '}
                    <i className={this.attr(`icon_class${f}`) ?? ''} />{' '}
                </div>
                <div className={`brand ${this.attr(`brand_bg_class${f}`) ?? ''}`}>
                    {' '}
                    <span className="label fg-white">
                        {' '}
                        <RawHtml html={this.attr('label_prepend')} />
                        <RawHtml html={this.val(this.attr('label_id'))} />
                        <RawHtml html={this.attr('label_append')} />{' '}
                    </span>{' '}
                    <div className={`badge ${this.attr(`badge_bg_class${f}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${f}`) ?? ''} />{' '}
                        {this.img(this.attr(`badge_src${f}`), 'badge')}{' '}
                    </div>{' '}
                </div>
            </div>,
        );
    }
}
