/**
 * The helpers the vis-1 templates of widgets/metro.html were built on, ported literally.
 *
 * Widget attributes arrive as strings in vis and in vis-2, and the templates test them for truth, compare them
 * loosely and concatenate them into attribute names (`'bg_class' + format(value)` -> `bg_class_true`). Every
 * React widget reproduces those expressions one by one, so the rules below must not be tidied up - a project that
 * relies on `'0'` counting as false keeps working only this way.
 */
import type { CSSProperties } from 'react';

/**
 * `vis.binds.metro.format(value, type, mustValue)` of widgets/metro.html.
 *
 *   no type / 'bool'   '_true' or '_false' - the suffix of the attribute variant to show
 *   10                 the integer behind the value, true/false as 1/0 (the value list)
 *   'compare'          '_true' when the value equals `mustValue` loosely, after mapping true/false to 1/0
 *   '%'                '42%'
 *   '°'                '21.5°C'
 */
export function metroFormat(value: any, type?: any, mustValue?: any): any {
    if (!type || type === 'bool') {
        return `_${!(!value || value === 'false' || value === '0')}`;
    }

    if (type == 10) {
        if (!value || value === 'false' || value === '0') {
            value = 0;
        }
        if (value === 'true' || value === true) {
            value = 1;
        }
        return parseInt(value, 10);
    }
    if (type === 'compare') {
        if (!value || value === 'false' || value === '0') {
            value = 0;
        }
        if (value === 'true' || value === true) {
            value = 1;
        }
        if (mustValue === 'true' || mustValue === '1') {
            mustValue = 1;
        }
        if (mustValue === 'false' || mustValue === '0') {
            mustValue = 0;
        }

        return `_${value == mustValue}`;
    }
    if (type === '%') {
        if (value !== undefined && (typeof value === 'number' || typeof value === 'string')) {
            value = `${parseFloat(value as string).toFixed(0)}%`;
        }
        return value === undefined ? '' : value;
    }
    if (type === '°') {
        if (value !== undefined && (typeof value === 'number' || typeof value === 'string')) {
            value = `${parseFloat(value as string).toFixed(1)}°C`;
        }
        return value === undefined ? '' : value;
    }
    return value;
}

/**
 * `'' + value` of the templates. State values and attributes are strings, numbers and booleans, and whatever else
 * arrives is turned into text the way JavaScript does it there, "[object Object]" included.
 */
export function asText(value: unknown): string {
    return String(value);
}

/** A checkbox attribute of the editor arrives as `true`, `'true'` or `''` */
export function isTrue(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
}

/**
 * The inline style the templates wrote for an icon or badge image:
 * `position: absolute;` plus `top:x%;left:x%;width:x%;height:x%;` for every attribute that is truthy - so the
 * string '0' adds `top:0%`, the number 0 does not, as in vis-1.
 */
export function imgStyle(data: Record<string, any>, prefix: 'icon' | 'badge'): CSSProperties {
    const style: CSSProperties = { position: 'absolute' };
    for (const key of ['top', 'left', 'width', 'height'] as const) {
        const value = data[`${prefix}_${key}`];
        if (value) {
            style[key] = `${value}%`;
        }
    }
    return style;
}

/**
 * What `$(el).data(name)` returned for an attribute the template wrote into `data-*`: `<%= %>` writes nothing for
 * an unset attribute, and jQuery turns "true", "false", "null" and numbers back into values. The click handlers of
 * vis-1 (`basic.toggle`, `basic.state`) read their parameters that way.
 */
export function jqData(value: unknown): unknown {
    const text = value === undefined || value === null ? '' : asText(value);
    if (text === 'true') {
        return true;
    }
    if (text === 'false') {
        return false;
    }
    if (text === 'null') {
        return null;
    }
    // jQuery: a number only if it survives the round trip unchanged ("1" yes, "1.0" and "01" no)
    if (text !== '' && `${+text}` === text) {
        return +text;
    }
    return text;
}

/**
 * The value `basic.state` of vis-1 writes on a click: the `value` attribute as the template put it into
 * `data-val` - so an unset value is the empty string - with "true"/"false" as booleans and numbers as numbers.
 */
export function stateClickValue(value: unknown): unknown {
    let val: unknown = value === undefined || value === null ? '' : asText(value);
    if (val === 'true') {
        val = true;
    }
    if (val === 'false') {
        val = false;
    }

    if (parseFloat(val as string).toString() == val) {
        val = parseFloat(val as string);
    }
    return val;
}

/** `parseFloat` of an attribute the way the templates read `min`/`max`: missing or empty gives the fallback */
export function numberOr(value: unknown, fallback: number): number {
    return value !== undefined && value !== null && value !== '' ? parseFloat(value as string) : fallback;
}
