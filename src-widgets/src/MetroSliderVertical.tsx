import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import Slider from './Components/MetroSlider';
import { widgetInfo } from './info';

const TPL = 'tplMetroSliderVertical';

/**
 * `tplMetroSliderVertical` - the vertical slider for `oid`; the filled part grows from the bottom.
 *
 * As with the horizontal one, `sliderColor` never had an effect and `oid-working` was never read.
 */
export default class MetroSliderVertical extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 16, height: 360 }, { drop: ['sliderColor', 'oid-working'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroSliderVertical.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(
            <Slider
                vertical
                style={{ height: '100%' }}
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
