import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import { widgetInfo } from './info';
import { metroFormat, stateClickValue } from './utils';

const TPL = 'tplMetroTileState';

/**
 * `tplMetroTileState` - a click writes `value` to `state_oid` (`vis.binds.basic.state` of vis-1); the variants
 * follow whether the state equals `value` (`format(..., 'compare', value)`).
 *
 * Kept from vis-1: the badge image is chosen by the plain truth of the state, not by the comparison.
 */
export default class MetroTileState extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileState.getWidgetInfo();
    }

    onClick = (): void => {
        this.write(this.attr('state_oid'), stateClickValue(this.attr('value')));
    };

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const state = this.val(this.attr('state_oid'));
        const f = metroFormat(state, 'compare', this.attr('value'));
        const selected = f === '_true' && this.attr('select_on_value') ? 'selected' : '';

        return this.renderFrame(
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
                    {' '}
                    <span
                        className="label fg-white"

                        dangerouslySetInnerHTML={{ __html: this.attr(`label${f}`) ?? '' }}
                    />{' '}
                    <div className={`badge ${this.attr(`badge_bg_class${f}`) ?? ''}`}>
                        {' '}
                        <i className={this.attr(`icon_badge${f}`) ?? ''} />{' '}
                        {this.img(this.attr(`badge_src${metroFormat(state)}`), 'badge')}{' '}
                    </div>{' '}
                </div>
            </div>,
            { padding: 3 },
            { onClick: this.state.editMode ? undefined : this.onClick },
        );
    }
}
