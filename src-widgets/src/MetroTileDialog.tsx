import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDialog';

/**
 * `tplMetroTileDialog` - a click opens the view `contains_view` in a dialog.
 */
export default class MetroTileDialog extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDialog.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const view = this.attr('contains_view');
        return this.renderFrame(
            <>
                {this.renderDialogTile({ badge: 'icon' })}
                {this.renderDialog(() => this.renderViewContent(view))}
            </>,
            { padding: 3 },
            { onClick: view ? this.openDialog : undefined },
        );
    }
}
