/**
 * The coercions the vis-1 widget set relied on.
 *
 * Widget attributes arrive as strings in both vis and vis-2, and `vis.binds.metro.format` (widgets/metro.html)
 * turned a state value into the suffix that picks the `_true` / `_false` variant of an attribute. Every tile
 * widget is built on that, so the rules are ported literally instead of being tidied up - a configuration that
 * relies on `'0'` counting as false must keep working after the migration.
 */

/** The suffix `vis.binds.metro.format(value)` produces for a boolean: `_true` or `_false`. */
export function boolSuffix(value: unknown): '_true' | '_false' {
    return !value || value === 'false' || value === '0' ? '_false' : '_true';
}

/** `format(value, 'compare', mustValue)` - loose comparison after mapping `true`/`false` to 1/0. */
export function compareSuffix(value: unknown, mustValue: unknown): '_true' | '_false' {
    const normalize = (v: unknown): unknown => {
        if (v === 'true' || v === true || v === '1') {
            return 1;
        }
        if (!v || v === 'false' || v === '0') {
            return 0;
        }
        return v;
    };
    return normalize(value) === normalize(mustValue) ? '_true' : '_false';
}

/** `format(value, 10)` - the integer behind a state value, with `true`/`false` counting as 1/0. */
export function toInt(value: unknown): number {
    if (!value || value === 'false' || value === '0') {
        return 0;
    }
    if (value === 'true' || value === true) {
        return 1;
    }
    return parseInt(value as string, 10);
}

/** `format(value, '%')` and `format(value, '°')`. */
export function formatUnit(value: unknown, unit: '%' | '°'): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    // The vis-1 code passed anything that was not a number or a string straight through, which rendered as
    // nothing in the tile - an empty string is the same result without stringifying an unknown.
    if (typeof value !== 'number' && typeof value !== 'string') {
        return '';
    }
    const number = parseFloat(value as string);
    if (isNaN(number)) {
        return String(value);
    }
    return unit === '%' ? `${number.toFixed(0)}%` : `${number.toFixed(1)}°C`;
}

/** A checkbox attribute of the editor arrives as `true`, `'true'` or `''`. */
export function isTrue(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
}

/** Turns the `icon_top` / `badge_width` percentages into the inline style the vis-1 templates built by hand. */
export function percentStyle(
    data: Record<string, any>,
    prefix: 'icon' | 'badge',
): { top?: string; left?: string; width?: string; height?: string; position: 'absolute' } {
    const style: Record<string, string> = {};
    for (const key of ['top', 'left', 'width', 'height'] as const) {
        const value = data[`${prefix}_${key}`];
        if (value !== undefined && value !== null && value !== '') {
            style[key] = `${value}%`;
        }
    }
    return { ...style, position: 'absolute' };
}
