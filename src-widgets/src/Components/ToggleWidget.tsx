import TileWidget, { type TileWidgetState } from './TileWidget';
import { jqData } from '../utils';

/**
 * The click of the two toggle tiles: `vis.binds.basic.toggle` of vis-1 (www/widgets/basic.html of ioBroker.vis,
 * MIT), ported branch by branch.
 *
 * It reads its parameters the way vis-1 did, from the `data-*` attributes the template wrote - so an unset
 * attribute is "", and "1" or "true" come back as a number or a boolean (`jqData`). The templates set no
 * `data-min`/`data-max`, so min and max are always undefined here.
 *
 * Without `oidTrue`/`urlTrue` the click toggles `oid`: empty, false or "false" -> true, true or "true" -> false,
 * any other value -> 0 if it is at least 0.5, else 1. With `oidTrue` and/or `urlTrue` it writes those instead, and
 * without `oid` it remembers the toggled state in the widget.
 */
export default class ToggleWidget<RxData extends Record<string, any>> extends TileWidget<
    RxData,
    TileWidgetState & { toggled?: boolean }
> {
    onToggle = (): void => {
        if (this.state.editMode) {
            return;
        }
        const oid = jqData(this.attr('oid')) as any;
        const min: any = undefined;
        const max: any = undefined;
        const urlTrue = jqData(this.attr('urlTrue')) as any;
        let urlFalse = jqData(this.attr('urlFalse')) as any;
        const oidTrue = jqData(this.attr('oidTrue')) as any;
        let oidFalse = jqData(this.attr('oidFalse')) as any;
        let oidTrueVal = jqData(this.attr('oidTrueValue')) as any;
        let oidFalseVal = jqData(this.attr('oidFalseValue')) as any;

        if (!(oid || oidTrue || urlTrue)) {
            return;
        }

        let val: any;
        if (oidTrue || urlTrue) {
            if (!oidFalse && oidTrue) {
                oidFalse = oidTrue;
            }
            if (!urlFalse && urlTrue) {
                urlFalse = urlTrue;
            }
            if (!oid || oid === 'nothing_selected') {
                val = !this.state.toggled;
                this.setState({ toggled: val });
            } else {
                val = this.val(oid);
                val = val === 1 || val === '1' || val === true || val === 'true';
                val = !val;
            }
            const falseValue = min === undefined || min === 'false' || min === null ? false : min;
            const trueValue = max === undefined || max === 'true' || max === null ? true : max;

            if (oidTrue) {
                if (val) {
                    if (oidTrueVal === undefined || oidTrueVal === null) {
                        oidTrueVal = trueValue;
                    }
                    this.write(oidTrue, ToggleWidget.typed(oidTrueVal));
                } else {
                    if (oidFalseVal === undefined || oidFalseVal === null) {
                        oidFalseVal = falseValue;
                    }
                    this.write(oidFalse, ToggleWidget.typed(oidFalseVal));
                }
            }
            if (urlTrue) {
                // vis.conn.httpGet(): a GET from the browser, the answer is not used
                void fetch(val ? urlTrue : urlFalse, { mode: 'no-cors' }).catch(() => {});
            }
        } else {
            val = this.val(oid);
            if (val === null || val === '' || val === undefined || val === false || val === 'false') {
                this.write(oid, true);
            } else if (val === true || val === 'true') {
                this.write(oid, false);
            } else {
                this.write(oid, parseFloat(val) >= 0.5 ? 0 : 1);
            }
        }
    };

    /** 'true'/'false' and numbers that print as themselves become values, as in basic.toggle */
    static typed(value: any): any {
        if (value === 'false') {
            return false;
        }
        if (value === 'true') {
            return true;
        }
        const f = parseFloat(value);

        return f.toString() == value ? f : value;
    }
}
