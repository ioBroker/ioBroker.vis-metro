import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import RawHtml from './Components/RawHtml';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileBoolNumber';

/**
 * `tplMetroTileBoolNumber` - like the bool tile, with the value of `number_oid` appended to the label.
 * The images are `icon_true_src` / `icon_false_src` here. Display only.
 *
 * Kept from vis-1: a number state that is `null` shows as "null" - the template only checks for `undefined`.
 */
export default class MetroTileBoolNumber extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileBoolNumber.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const f = metroFormat(this.val(this.attr('state_oid')));
        const selected = f === '_true' && this.attr('select_on_true') ? 'selected' : '';
        const number = this.val(this.attr('number_oid'));
        // `(label || '') + (number !== undefined ? number : '')` - a string concatenation, so null becomes "null"
        const label = `${this.attr(`label${f}`) || ''}${number !== undefined ? number : ''}`;

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile ${this.attr('hover') ? 'hover ' : ''}${selected} ${this.attr(`bg_class${f}`) ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content icon ${this.attr(`icon_class${f}`) ? '' : 'icon-custom'}`}>
                    {' '}
                    {this.img(this.attr(`icon${f}_src`), 'icon')}{' '}
                    <i className={this.attr(`icon_class${f}`) ?? ''} />{' '}
                </div>
                <div className={`brand ${this.attr(`brand_bg_class${f}`) ?? ''}`}>
                    {' '}
                    <span className="label fg-white">
                        <RawHtml html={label} />
                        <RawHtml html={this.attr('label_append') || ''} />
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
