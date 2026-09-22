import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import ToggleWidget from './Components/ToggleWidget';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileToggle';

/**
 * `tplMetroTileToggle` - a click toggles `oid`, or writes `oidTrue`/`oidFalse` and calls `urlTrue`/`urlFalse`
 * (see ToggleWidget).
 *
 * Kept from vis-1:
 * - the tile carries the class `icon` itself as well;
 * - the glyph follows the plain truth of the value, while everything else follows `format()` - so the string
 *   "false" shows the icon of true on a tile that is otherwise false;
 * - the badge image is chosen by `state_oid`, which this template does not have - always `badge_src_false`.
 */
export default class MetroTileToggle extends ToggleWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileToggle.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const value = this.val(this.attr('oid'));
        const f = metroFormat(value);
        const selected = f === '_true' && this.attr('select_on_true') ? 'selected' : '';

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
                    <div className={`badge ${this.attr(`badge_bg_class${f}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${f}`) ?? ''} />{' '}
                        {this.img(this.attr(`badge_src${metroFormat(this.val(this.attr('state_oid')))}`), 'badge')}{' '}
                    </div>{' '}
                </div>
            </div>,
            { padding: 3 },
            { onClick: this.onToggle },
        );
    }
}
