/**
 * Helpers for the two editor field types that the metro widgets need and that `RxWidgetInfo` cannot express.
 *
 * A vis-1 template writes `bg_class[bg-indigo]/style,metro-,bg- ribbed-`, and `parseAttributes()`
 * (src-vis/src/Vis/visWidgetsCatalog.tsx) splits that comma list into `filterFile` / `filterName` /
 * `filterAttrs` / `removeName` on the field. `WidgetField.tsx` then reads exactly those four properties to
 * build the dropdown.
 *
 * That split only happens for the STRING form of `visAttrs`. A React widget passes an array of groups, which is
 * handed through `deepCloneRx()` untouched - so the four properties have to be set directly on the field, which
 * works at runtime but is not in `RxWidgetInfoAttributesFieldSimple`. Hence the cast, in one place.
 */
import type { RxWidgetInfoAttributesField } from '@iobroker/types-vis-2';

interface StyleFilter {
    /** Matched against the file name of the stylesheet, e.g. `metro-` or `iconFont` */
    filterFile: string;
    /** Matched against the class name, e.g. `bg- ribbed-` (space separated alternatives) */
    filterName: string;
    /** Only keep classes that set one of these CSS properties */
    filterAttrs?: string;
    /** Stripped from the label shown in the dropdown, e.g. `Icon ` */
    removeName?: string;
}

/** A dropdown of CSS classes collected from the loaded stylesheets. */
function styleSelect(
    field: { name: string; label?: string; default?: string; hidden?: string },
    filter: StyleFilter,
): RxWidgetInfoAttributesField {
    return { ...field, type: 'style', ...filter } as unknown as RxWidgetInfoAttributesField;
}

/**
 * Background / ribbed class picker - the counterpart of `/style,metro-,bg- ribbed-`.
 *
 * `ribbed` false narrows it to the plain colours, which is what the badge attributes did
 * (`/style,metro-,bg-`).
 */
export function colorField(
    name: string,
    label: string,
    defaultValue: string,
    options: { ribbed?: boolean; hidden?: string } = {},
): RxWidgetInfoAttributesField {
    return styleSelect(
        { name, label, default: defaultValue, hidden: options.hidden },
        { filterFile: 'metro-', filterName: options.ribbed === false ? 'bg-' : 'bg- ribbed-' },
    );
}

/** Icon class picker - the counterpart of `/style,iconFont,icon-,,Icon `. */
export function iconField(
    name: string,
    label: string,
    defaultValue: string,
    options: { hidden?: string } = {},
): RxWidgetInfoAttributesField {
    return styleSelect(
        { name, label, default: defaultValue, hidden: options.hidden },
        { filterFile: 'iconFont', filterName: 'icon-', filterAttrs: '', removeName: 'Icon ' },
    );
}
