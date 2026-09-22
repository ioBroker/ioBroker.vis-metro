import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import RawHtml from './Components/RawHtml';
import { widgetInfo } from './info';
import { metroFormat, stateClickValue } from './utils';

const TPL = 'tplMetroTileStateNumber';

/**
 * `tplMetroTileStateNumber` - like the state tile, with the value of `number_oid` in the badge. A click writes
 * `value` to `state_oid`.
 *
 * Kept from vis-1: the badge colour and icon are looked up as `badge_bg_class_true/_false` and
 * `icon_badge_true/_false`, attributes this template does not have - so the badge has neither. `badge_bg_class`
 * and `hide_on_0` are offered but were never used; they are not offered any more.
 */
export default class MetroTileStateNumber extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 }, { drop: ['badge_bg_class', 'hide_on_0'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileStateNumber.getWidgetInfo();
    }

    onClick = (): void => {
        this.write(this.attr('state_oid'), stateClickValue(this.attr('value')));
    };

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const state = this.val(this.attr('state_oid'));
        const f = metroFormat(state, 'compare', this.attr('value'));
        const selected = f === '_true' && this.attr('select_on_value') ? 'selected' : '';
        const number = this.val(this.attr('number_oid'));

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
                        <RawHtml html={this.attr(`label${f}`)} />
                        <RawHtml html={this.attr('label_append')} />
                    </span>{' '}
                    <div className={`badge ${this.attr(`badge_bg_class${f}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${f}`) ?? ''} />{' '}
                        {this.img(this.attr(`badge_src${metroFormat(state)}`), 'badge')}
                        {/* `<%= %>` writes nothing for undefined and null */}
                        {number === undefined || number === null ? '' : String(number)}{' '}
                    </div>{' '}
                </div>
            </div>,
            { padding: 3 },
            { onClick: this.state.editMode ? undefined : this.onClick },
        );
    }
}
