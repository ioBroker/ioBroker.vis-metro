import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileStaticDialogNumber';

/**
 * `tplMetroTileStaticDialogNumber` - the static html dialog, with the value of `number_oid` in the badge.
 *
 * `hide_on_0` is offered by the vis-1 template but was never used - the badge hides below 1 anyway. It is not
 * offered any more.
 */
export default class MetroTileStaticDialogNumber extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 }, { drop: ['hide_on_0'] });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileStaticDialogNumber.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const html = this.attr('html');
        return this.renderFrame(
            <>
                {this.renderDialogTile({
                    badge: 'number',
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
