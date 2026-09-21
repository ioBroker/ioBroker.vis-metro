import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import MetroTileBool from './MetroTileBool';
import { widgetInfo } from './info';

const TPL = 'tplMetroTileBoolDialog';

/**
 * `tplMetroTileBoolDialog` - the bool tile, and a click opens `contains_view` in a dialog.
 *
 * The tile is the template of the bool tile, character for character - including the badge image that is always
 * `badge_src_false` (see there).
 */
export default class MetroTileBoolDialog extends MetroTileBool {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileBoolDialog.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const view = this.attr('contains_view');
        return this.renderFrame(
            <>
                {this.renderTile()}
                {this.renderDialog(() => this.renderViewContent(view))}
            </>,
            { padding: 3 },
            { onClick: view ? this.openDialog : undefined },
        );
    }
}
