import type React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { dimmerImage, levelFraction } from './Components/LevelWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDimmer';

/**
 * `tplMetroTileDimmer` - a wide tile with a lamp in eleven steps, a switch and a slider for `oid`.
 *
 * The switch writes `max` and `min` (missing: 1 and 0), the slider values between them.
 *
 * Kept from vis-1:
 * - the lamp counts true as 1, not as max;
 * - the slider gets `parseFloat(min)` and `parseFloat(max)`, so without both attributes it does not work: vis-1
 *   placed nothing and wrote NaN. The port places nothing and writes nothing;
 * - the switch is checked by the plain truth of the value (see InputControl), not by the middle of min and max.
 */
export default class MetroTileDimmer extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 287, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDimmer.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const fraction = levelFraction(this.val(this.attr('oid')), this.attr('min'), this.attr('max'));
        return this.renderFrame(
            this.renderLevelTile(dimmerImage(fraction), undefined, {
                min: parseFloat(this.attr('min')),
                max: parseFloat(this.attr('max')),
                step: parseFloat(this.attr('step')),
                ...this.sliderColors(),
            }),
        );
    }
}
