import type React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { levelFraction, shutterImage } from './Components/LevelWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileShutterDialog';

/**
 * `tplMetroTileShutterDialog` - a tile with the window; a click opens a dialog with a switch and a slider for
 * `oid` (`tileDialogSlider` of vis-1).
 *
 * Kept from vis-1: the window counts true as 1, not as max; the switch is checked by the plain truth of the value.
 */
export default class MetroTileShutterDialog extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileShutterDialog.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const fraction = levelFraction(this.val(this.attr('oid')), this.attr('min'), this.attr('max'));
        return this.renderLevelDialogWidget(
            this.renderLevelDialogTile(shutterImage(fraction), '90px', this.attr('brand_bg_class')),
            false,
        );
    }
}
