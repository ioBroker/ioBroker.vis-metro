import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileBool';

/**
 * `tplMetroTileBool` - a boolean state as a metro tile. Display only: the template bound no click handler.
 *
 * Every visual attribute exists twice, and the template picks the variant by appending the suffix of
 * `format(value)` to the attribute name: `bg_class` + `_true`.
 *
 * Kept from vis-1: the badge image is chosen by `state_oid`, an attribute this template does not have - so it
 * is always `badge_src_false`.
 */
export default class MetroTileBool extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileBool.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(this.renderTile());
    }

    /** The `.tile` of the template - the bool dialog tile has the very same */
    renderTile(): React.JSX.Element {
        const f = metroFormat(this.val(this.attr('oid')));
        const selected = f === '_true' && this.attr('select_on_true') ? 'selected' : '';

        return (
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile ${this.attr('hover') ? 'hover ' : ''}${selected} ${this.attr(`bg_class${f}`) ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div className={`tile-content icon ${this.attr(`icon_class${f}`) ? '' : 'icon-custom'}`}>
                    {' '}
                    {this.img(this.attr(`icon${f}`), 'icon')} <i className={this.attr(`icon_class${f}`) ?? ''} />{' '}
                </div>
                <div className={`brand ${this.attr(`brand_bg_class${f}`) ?? ''}`}>
                    <span
                        className="label fg-white"

                        dangerouslySetInnerHTML={{ __html: this.attr(`label${f}`) ?? '' }}
                    />
                    <div className={`badge ${this.attr(`badge_bg_class${f}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${f}`) ?? ''} />{' '}
                        {this.img(this.attr(`badge_src${metroFormat(this.val(this.attr('state_oid')))}`), 'badge')}{' '}
                    </div>
                </div>
            </div>
        );
    }
}
