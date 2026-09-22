import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import { VIS1 } from './vis1.generated';
import { visAttrs, type VisAttrsOptions } from './visAttrs';

/**
 * `getWidgetInfo()` of a metro widget, from its vis-1 template.
 *
 * The id and the set must be the ones of the template: vis-2 replaces an EJS widget by the React widget that
 * declares the same id - that is the whole migration. `visName` stays the name of vis-1; the palette shows
 * `visWidgetLabel`, which is unique (vis-1 had two widgets called "Tile Dialog").
 *
 * @param tpl     the id of the vis-1 template
 * @param size    the size of the widget div in the template
 * @param size.width  its width in px
 * @param size.height its height in px
 * @param options what to leave out and the handlers of the editor, see visAttrs()
 */
export function widgetInfo(
    tpl: string,
    size: { width?: number; height?: number },
    options?: VisAttrsOptions,
): RxWidgetInfo {
    return {
        id: tpl,
        visSet: 'metro',
        visSetLabel: 'set_label',
        visName: VIS1[tpl].name,
        visWidgetLabel: tpl,
        visHelp: `help_${tpl}`,
        visAttrs: visAttrs(VIS1[tpl].attrs, options),
        visDefaultStyle: { ...size, position: 'absolute' },
        visPrev: `widgets/vis-2-widgets-metro/img/prev_${tpl}.png`,
    };
}
