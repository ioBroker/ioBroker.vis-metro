/**
 * The metro colour palette - the single source of truth for `bg-*`, `fg-*` and `ribbed-*`.
 *
 * In `widgets/metro/css/metro-bootstrap.css` those three families take 467 rules / 81 KB, although
 * they hold nothing beyond the 53 hex values below: `bg-x`, `fg-x`, `bg-hover-x:hover`,
 * `bg-active-x:active`, `bg-focus-x:focus` and the `fg-` counterparts all repeat the same value,
 * and every `ribbed-x` is that value plus one shared gradient.
 *
 * The class names are public API: vis stores them verbatim in the user's project
 * (`bg_class`, `brand_bg_class`, `badge_bg_class`, `icon_class`, ...), and the editor builds the
 * dropdown by scanning the loaded stylesheets for classes starting with `bg-` / `ribbed-`
 * (`/style,metro-,bg- ribbed-` in widgets/metro.html). So: never rename one, never change a value.
 *
 *   node tools/generate.mjs            writes src/styles/metro-palette.css
 *   node tools/generate.mjs --verify   diffs the generated classes against the original stylesheet
 */

/** Base colours, in the order the original stylesheet declares them (the editor keeps that order). */
export const COLORS = {
    black:       '#000000',
    white:       '#ffffff',
    lime:        '#a4c400',
    green:       '#60a917',
    emerald:     '#008a00',
    teal:        '#00aba9',
    cyan:        '#1ba1e2',
    cobalt:      '#0050ef',
    indigo:      '#6a00ff',
    violet:      '#aa00ff',
    pink:        '#dc4fad',
    magenta:     '#d80073',
    crimson:     '#a20025',
    red:         '#e51400',
    orange:      '#fa6800',
    amber:       '#f0a30a',
    yellow:      '#e3c800',
    brown:       '#825a2c',
    olive:       '#6d8764',
    steel:       '#647687',
    mauve:       '#76608a',
    taupe:       '#87794e',
    gray:        '#555555',
    dark:        '#333333',
    darker:      '#222222',
    transparent: 'transparent',
    darkBrown:   '#63362f',
    darkCrimson: '#640024',
    darkMagenta: '#81003c',
    darkIndigo:  '#4b0096',
    darkCyan:    '#1b6eae',
    darkCobalt:  '#00356a',
    darkTeal:    '#004050',
    darkEmerald: '#003e00',
    darkGreen:   '#128023',
    darkOrange:  '#bf5a15',
    darkRed:     '#9a1616',
    darkPink:    '#9a165a',
    darkViolet:  '#57169a',
    darkBlue:    '#16499a',
    lightBlue:   '#4390df',
    lightRed:    '#ff2d19',
    lightGreen:  '#7ad61d',
    lighterBlue: '#00ccff',
    lightTeal:   '#45fffd',
    lightOlive:  '#78aa1c',
    lightOrange: '#c29008',
    lightPink:   '#f472d0',
    grayDark:    '#333333',
    grayDarker:  '#222222',
    grayLight:   '#999999',
    grayLighter: '#eeeeee',
    blue:        '#00aff0',
};

/** The 49 colours that also exist as a ribbed (striped) surface. */
export const RIBBED = [
    'black', 'white', 'lime', 'green', 'emerald', 'teal',
    'cyan', 'cobalt', 'indigo', 'violet', 'pink', 'magenta',
    'crimson', 'red', 'orange', 'amber', 'yellow', 'brown',
    'olive', 'steel', 'mauve', 'taupe', 'dark', 'darkBrown',
    'darkCrimson', 'darkMagenta', 'darkIndigo', 'darkCyan', 'darkCobalt', 'darkTeal',
    'darkEmerald', 'darkGreen', 'darkOrange', 'darkRed', 'darkPink', 'darkViolet',
    'darkBlue', 'lightTeal', 'lightOlive', 'lightOrange', 'lightPink', 'lightRed',
    'lightGreen', 'grayed', 'grayDarker', 'gray', 'grayLight', 'grayLighter',
    'blue',
];

/** `ribbed-dark` and `ribbed-grayed` are the two that do not reuse their `bg-` value. */
export const RIBBED_OVERRIDES = {
    dark:        '#1d1d1d',
    grayed:      '#585858',
};

/** One formula for all 49 ribbed surfaces: 45 degree stripes, 40px period. */
export const RIBBED_GRADIENT =
    'linear-gradient(-45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)';

/** Only these state suffixes existed; the editor never offered them (it skips selectors with a colon). */
export const STATES = { hover: ':hover', active: ':active', focus: ':focus' };
