import React from 'react';

import { asText } from '../utils';

/**
 * A piece of user html, output unescaped as `<%== %>` did in the vis-1 templates.
 *
 * React can only set raw html as the whole content of an element, so it gets a wrapper that must be invisible in
 * every respect: `display: contents` takes away its box, and `all: inherit` its styles - it is still a <span> to
 * the stylesheets, and `.metro-rx span`, `.metro-rx .tile *` would give the text a font the bare text node of
 * vis-1 never had. A number in a tile whose content has the class `icon-custom`, for instance, is drawn in the
 * fallback of the icon font there, not in the text font. `all` comes first, so `display` still applies.
 */
export default function RawHtml(props: { html: unknown }): React.JSX.Element | null {
    if (props.html === undefined || props.html === null || props.html === '') {
        return null;
    }
    return (
        <span
            style={{ all: 'inherit', display: 'contents' }}
            dangerouslySetInnerHTML={{ __html: asText(props.html) }}
        />
    );
}
