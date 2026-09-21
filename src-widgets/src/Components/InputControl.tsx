import React from 'react';

import RawHtml from './RawHtml';

/**
 * Whether `vis.binds.basic.checkbox` of vis-1 shows the box checked (its `_onChange`).
 *
 * The state value as a string is read like a number where it is one; then the box is checked by the plain truth of
 * the value. vis-1 meant numeric checkboxes (the switches of the dimmer and shutter tiles) to compare with the
 * middle of min and max, but read a jQuery data key that was never set - so they are checked by truth, too.
 */
export function basicChecked(value: unknown): boolean {
    let val: any = value;
    if (val === 'false') {
        val = false;
    } else if (val === 'true') {
        val = true;
    } else if (typeof val === 'string') {
        const f = parseFloat(val);

        val = f == (val as unknown as number) ? f : val !== '';
    }
    return !!val;
}

/**
 * The value a click writes (`basic.checkbox`): max when checked, min when not - for a numeric checkbox min and
 * max as given (missing: 0 and 1), else true and false.
 */
export function basicCheckboxValue(checked: boolean, numeric: boolean, min?: unknown, max?: unknown): unknown {
    if (!numeric) {
        return checked;
    }
    const low = min !== undefined && min !== null && min !== '' ? parseFloat(min as string) : 0;
    const high = max !== undefined && max !== null && max !== '' ? parseFloat(max as string) : 1;
    return checked ? high : low;
}

/**
 * `<div class="input-control switch|checkbox">` of the templates: a label around the invisible checkbox, the drawn
 * `.check` and optional html before and after it, with the whitespace the templates had between them.
 */
export default function InputControl(props: {
    type: 'switch' | 'checkbox';
    checked: boolean;
    readOnly?: boolean;
    onChange: (checked: boolean) => void;
    prepend?: unknown;
    append?: unknown;
    /** without the whitespace - the dimmer and shutter dialogs built the markup from strings */
    bare?: boolean;
}): React.JSX.Element {
    if (props.bare) {
        return (
            <div className={`input-control ${props.type}`}>
                <label>
                    <input
                        type="checkbox"
                        checked={props.checked}
                        onChange={e => !props.readOnly && props.onChange(e.target.checked)}
                    />
                    <span className="check" />
                </label>
            </div>
        );
    }
    return (
        <div className={`input-control ${props.type}`}>
            <label>
                {' '}
                <RawHtml html={props.prepend} />{' '}
                <input
                    type="checkbox"
                    checked={props.checked}
                    onChange={e => !props.readOnly && props.onChange(e.target.checked)}
                />{' '}
                <span className="check" /> <RawHtml html={props.append} />{' '}
            </label>
        </div>
    );
}
