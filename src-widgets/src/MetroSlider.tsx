import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import Slider from './Components/MetroSlider';
import { widgetInfo } from './info';

const TPL = 'tplMetroSlider';

/**
 * `tplMetroSlider` - a horizontal slider for `oid` (see Components/MetroSlider for the mapping and the writing).
 *
 * `sliderColor` is offered by the vis-1 template, but its binding asks for `sliderBgColor` - the colour of the
 * track never changed. It is not offered any more. `oid-working` was never read either.
 */
export default class MetroSlider extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 360, height: 16 }, { drop: ['sliderColor', 'oid-working'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroSlider.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(
            <Slider
                value={this.val(this.attr('oid'))}
                options={{
                    min: this.attr('min'),
                    max: this.attr('max'),
                    step: this.attr('step'),
                    completeColor: this.attr('sliderCompleteColor'),
                    markerColor: this.attr('sliderMarkerColor'),
                }}
                disabled={this.state.editMode}
                onChange={value => this.write(this.attr('oid'), value)}
            />,
            {},
            { style: { padding: 2 } },
        );
    }
}
