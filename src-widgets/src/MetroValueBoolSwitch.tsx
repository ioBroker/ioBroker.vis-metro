import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import TileWidget from './Components/TileWidget';
import InputControl, { basicChecked, basicCheckboxValue } from './Components/InputControl';
import { widgetInfo } from './info';

const TPL = 'tplMetroValueBoolSwitch';

/** `tplMetroValueBoolSwitch` - an on/off switch for a boolean state, with free html before and after it */
export default class MetroValueBoolSwitch extends TileWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 60, height: 40 });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroValueBoolSwitch.getWidgetInfo();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(
            <InputControl
                type="switch"
                checked={basicChecked(this.val(this.attr('oid')))}
                readOnly={this.state.editMode}
                prepend={this.attr('html_prepend')}
                append={this.attr('html_append')}
                onChange={checked => this.write(this.attr('oid'), basicCheckboxValue(checked, false))}
            />,
            {},
        );
    }
}
