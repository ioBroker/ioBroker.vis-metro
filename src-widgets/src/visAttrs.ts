/**
 * Builds the editor fields of a React widget from the attribute list of its vis-1 template.
 *
 * The widget data of a project is stored per attribute name, and a new widget gets the defaults of its fields - so
 * the names, the defaults, the types and even the order must be the ones of widgets/metro.html. Instead of writing
 * them down a second time, every widget passes the `data-vis-attrs` string of its template (taken over verbatim by
 * tools/extractVis1.mjs into src/vis1.generated.ts) and this turns it into `visAttrs`. The rules are the ones of
 * `parseAttributes()` in vis-2 (src-vis/src/Vis/visWidgetsCatalog.tsx), which reads the same strings for the
 * vis-1 widgets:
 *
 *   name                        a text field
 *   name[default]               with a default; `~` stands for `/`, `§` for `;` and `^` for `"`
 *   name(0-7)                   name0 ... name7
 *   name/type                   id, checkbox, image, color, views, html, number
 *   name/slider,min,max,step    a slider
 *   name/style,file,name,attrs,remove
 *                               a dropdown of CSS classes, see fields.ts
 *   name/type/onChangeFunc      plus a handler when the value changes
 *   group.name                  starts the group `name`
 *
 * Every field gets its name as label; the widget set adds its i18n prefix, and src/i18n holds the texts.
 */
import type {
    RxWidgetInfoAttributesField,
    RxWidgetInfoFieldChangeHandler,
    RxWidgetInfoGroup,
} from '@iobroker/types-vis-2';

import en from './i18n/en.json';

export interface VisAttrsOptions {
    /**
     * Attributes of the vis-1 template that the React widget does not offer, because vis-1 never used them.
     * Values stored in a project stay untouched. `npm run check-widgets` lists them with the reason.
     */
    drop?: string[];
    /** Handlers for the `/onChangeFunc` part of a field, by the name of that function */
    onChange?: Record<string, RxWidgetInfoFieldChangeHandler>;
}

const words = en as Record<string, string>;

function decode(text: string): string {
    return text.replace(/§/g, ';').replace(/~/g, '/').replace(/\^/g, '"');
}

function toField(
    name: string,
    type: string,
    defaultValue: string | undefined,
    onChange?: RxWidgetInfoFieldChangeHandler,
): RxWidgetInfoAttributesField {
    const field: Record<string, any> = { name, label: name };
    if (words[`${name}_tooltip`]) {
        field.tooltip = `${name}_tooltip`;
    }
    if (onChange) {
        field.onChange = onChange;
    }

    const options = type.split(',');
    const kind = options[0] || (name === 'oid' || name.startsWith('oid-') ? 'id' : '');

    switch (kind) {
        case 'id':
        case 'image':
        case 'color':
        case 'views':
        case 'html':
            field.type = kind;
            break;
        case 'number':
            field.type = 'number';
            break;
        case 'checkbox':
            field.type = 'checkbox';
            break;
        case 'slider':
            field.type = 'slider';
            field.min = parseFloat(options[1]);
            field.max = parseFloat(options[2]);
            field.step = parseFloat(options[3]);
            break;
        case 'style':
            // vis-2 reads these four off the field; only the string form of visAttrs sets them by itself
            field.type = 'style';
            field.filterFile = options[1] || '';
            field.filterName = options[2] || '';
            field.filterAttrs = options[3] || '';
            field.removeName = options[4] || '';
            break;
        default:
            // a text field
            break;
    }

    if (defaultValue !== undefined) {
        // a checkbox stores a boolean, everything else the string of the template - `badge_top[0]` is the string
        // '0', and the templates test these values for truth, where '0' and 0 differ
        field.default = kind === 'checkbox' ? defaultValue === 'true' : decode(defaultValue);
    }
    return field as RxWidgetInfoAttributesField;
}

/** The editor groups of a widget, from the `data-vis-attrs` of its vis-1 template */
export function visAttrs(dsl: string, options: VisAttrsOptions = {}): RxWidgetInfoGroup[] {
    const groups: { name: string; label?: string; fields: RxWidgetInfoAttributesField[] }[] = [
        { name: 'common', fields: [] },
    ];
    let group = groups[0];

    for (let part of dsl.split(';')) {
        part = part.trim();
        if (!part) {
            continue;
        }
        if (part.startsWith('group.')) {
            const name = part.substring('group.'.length).split('/')[0];
            let found = groups.find(g => g.name === name);
            if (!found) {
                found = { name, label: `group_${name}`, fields: [] };
                groups.push(found);
            }
            group = found;
            continue;
        }

        const [head, type = '', onChangeFunc] = part.split('/');
        const m = /^([^[(]+)(?:\((\d+)-(\d+)\))?(?:\[(.*)\])?$/.exec(head);
        if (!m) {
            continue;
        }
        const [, name, from, to, defaultValue] = m;
        const onChange = onChangeFunc ? options.onChange?.[onChangeFunc] : undefined;

        const names =
            from === undefined
                ? [name]
                : Array.from(
                      { length: parseInt(to, 10) - parseInt(from, 10) + 1 },
                      (_, i) => `${name}${parseInt(from, 10) + i}`,
                  );
        for (const fieldName of names) {
            if (!options.drop?.includes(fieldName) && !options.drop?.includes(name)) {
                group.fields.push(toField(fieldName, type, defaultValue, onChange));
            }
        }
    }

    return groups.filter(g => g.fields.length);
}
