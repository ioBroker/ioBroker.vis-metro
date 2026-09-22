import type React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { dimmerImage, levelFraction } from './Components/LevelWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDimmerDialogactiv';

/**
 * `tplMetroTileDimmerDialogactiv` - the dimmer dialog tile whose brand takes `brand_bg_class_true` while the
 * value is above 0 and `brand_bg_class_false` otherwise.
 *
 * Not offered any more: `brand_bg_class`, which the template listed but never used, and `autoclose` - vis-1
 * looked for a dialog `<widget id>_dialog` that the metro dialog never had, so it never closed anything.
 */
export default class MetroTileDimmerDialogactiv extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 }, { drop: ['brand_bg_class', 'autoclose'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDimmerDialogactiv.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const value = this.val(this.attr('oid'));
        const fraction = levelFraction(value, this.attr('min'), this.attr('max'));
        const brand = value > 0 ? this.attr('brand_bg_class_true') : this.attr('brand_bg_class_false');
        return this.renderLevelDialogWidget(this.renderLevelDialogTile(dimmerImage(fraction), '90%', brand), true);
    }
}
