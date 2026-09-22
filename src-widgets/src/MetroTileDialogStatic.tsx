import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileDialogStatic';

/**
 * `tplMetroTileDialogStatic` - a click opens a dialog with the fixed html of `html`; the tile shows the value of
 * `content_oid` next to the icon.
 */
export default class MetroTileDialogStatic extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileDialogStatic.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const html = this.attr('html');
        return this.renderFrame(
            <>
                {this.renderDialogTile({
                    badge: 'icon',
                    fgWhite: true,
                    content: this.attr('content_oid') ? this.val(this.attr('content_oid')) : '',
                })}
                {this.renderDialog(() => (
                    <div
                        style={{ display: 'contents' }}

                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                ))}
            </>,
            { padding: 3 },
            { onClick: html ? this.openDialog : undefined },
        );
    }
}
