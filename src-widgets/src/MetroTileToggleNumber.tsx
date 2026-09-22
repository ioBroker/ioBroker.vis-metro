import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import ToggleWidget from './Components/ToggleWidget';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileToggleNumber';

/**
 * `tplMetroTileToggleNumber` - the toggle tile with the value of `number_oid` in the badge; the badge is hidden
 * while that value is not above 0.
 *
 * Kept from vis-1: the glyph follows the plain truth of the value (see the toggle tile). `hide_on_0`,
 * `badge_bg_class_false` and `badge_bg_class_true` are offered but were never used - the badge always takes
 * `badge_bg_class`; they are not offered any more.
 */
export default class MetroTileToggleNumber extends ToggleWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(
            TPL,
            { width: 136, height: 136 },
            { drop: ['hide_on_0', 'badge_bg_class_false', 'badge_bg_class_true'] },
        );
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileToggleNumber.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const value = this.val(this.attr('oid'));
        const f = metroFormat(value);
        const selected = f === '_true' && this.attr('select_on_true') ? 'selected' : '';
        const number = this.val(this.attr('number_oid'));

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile icon ${this.attr('hover') ? 'hover ' : ''}${selected} ${this.attr(`bg_class${f}`) ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content icon ${this.attr(`icon_class${f}`) ? '' : 'icon-custom'}`}>
                    {' '}
                    {this.img(this.attr(`icon${f}`), 'icon')}{' '}
                    <i className={(value ? this.attr('icon_class_true') : this.attr('icon_class_false')) ?? ''} />{' '}
                </div>
                <div className={`brand ${this.attr(`brand_bg_class${f}`) ?? ''}`}>
                    {' '}
                    <span
                        className="label fg-white"

                        dangerouslySetInnerHTML={{ __html: this.attr(`label${f}`) ?? '' }}
                    />{' '}
                    <div
                        style={number > 0 ? undefined : { display: 'none' }}
                        className={`badge ${this.attr('badge_bg_class') ?? ''}`}
                    >
                        {number === undefined || number === null ? '' : String(number)}
                    </div>{' '}
                </div>
            </div>,
            { padding: 3 },
            { onClick: this.onToggle },
        );
    }
}
