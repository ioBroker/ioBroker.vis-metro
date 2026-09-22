import type React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { levelFraction, shutterImage } from './Components/LevelWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileShutter';

/**
 * `tplMetroTileShutter` - a wide tile with a window in eleven steps, a switch and a slider for `oid`.
 *
 * The window is open at max and closed at min; the switch writes `max` and `min` (missing: 1 and 0) and keeps
 * its state while `oid-working` is true.
 *
 * Kept from vis-1: the window counts true as 1, not as max; the switch is checked by the plain truth of the
 * value (see InputControl).
 */
export default class MetroTileShutter extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 287, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileShutter.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const fraction = levelFraction(this.val(this.attr('oid')), this.attr('min'), this.attr('max'));
        return this.renderFrame(
            this.renderLevelTile(shutterImage(fraction), this.attr('oid-working'), {
                min: this.attr('min'),
                max: this.attr('max'),
                step: parseFloat(this.attr('step')),
                ...this.sliderColors(),
            }),
        );
    }
}
