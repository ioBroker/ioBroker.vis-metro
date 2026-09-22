import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDialogString';

/**
 * `tplMetroTileDialogString` - a click opens a dialog with the value of `dialog_oid` as html, in the font size,
 * padding and alignment of the `dialog_*` attributes; it follows the state while the dialog is open.
 */
export default class MetroTileDialogString extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDialogString.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(
            <>
                {this.renderDialogTile({
                    badge: 'icon',
                    content: this.attr('content_oid') ? this.val(this.attr('content_oid')) : '',
                })}
                {this.renderDialog(() => this.renderStringContent())}
            </>,
            { padding: 3 },
            { onClick: this.openDialog },
        );
    }
}
