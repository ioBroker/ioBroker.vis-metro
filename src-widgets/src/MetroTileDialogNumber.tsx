import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDialogNumber';

/**
 * `tplMetroTileDialogNumber` - the view dialog, with the value of `number_oid` in the badge.
 *
 * `hide_on_0` was never used; it is not offered any more.
 */
export default class MetroTileDialogNumber extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 }, { drop: ['hide_on_0'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDialogNumber.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const view = this.attr('contains_view');
        return this.renderFrame(
            <>
                {this.renderDialogTile({ badge: 'number' })}
                {this.renderDialog(() => this.renderViewContent(view))}
            </>,
            { padding: 3 },
            { onClick: view ? this.openDialog : undefined },
        );
    }
}
