import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DialogTileWidget from './Components/DialogTileWidget';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileFrameDialogNumber';

/**
 * `tplMetroTileFrameDialogNumber` - a click opens `dialog_url` in an iframe dialog; the tile shows the html of
 * `content`, the badge the text of `badge_label`.
 */
export default class MetroTileFrameDialogNumber extends DialogTileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileFrameDialogNumber.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const url = this.attr('dialog_url');
        return this.renderFrame(
            <>
                {this.renderDialogTile({ badge: 'label', content: this.attr('content') || '' })}
                {this.renderDialog(
                    () => (
                        <iframe
                            title={this.attr('dialog_title') || url}
                            src={url}
                            style={{ width: '100%', height: '100%' }}
                            scrolling={this.attr('dialog_scroll') ? 'yes' : 'no'}
                        />
                    ),
                    {},
                    { overflow: 'hidden' },
                )}
            </>,
            { padding: 3 },
            { onClick: url ? this.openDialog : undefined },
        );
    }
}
