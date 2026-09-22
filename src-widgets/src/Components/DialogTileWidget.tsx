import React from 'react';

import TileWidget from './TileWidget';
import RawHtml from './RawHtml';

/**
 * The tile the dialog templates of widgets/metro.html share (`tplMetroTileDialog*`, `...DialogNumber`,
 * `...DialogString`, `...DialogStatic`, `...FrameDialogNumber`): one icon, one colour, a label and a badge -
 * no true/false variants. They differ only in what the tile shows besides the icon and what the badge holds:
 *
 *   badge 'icon'     <div class="badge ..."><i class="icon_badge"></i></div>
 *   badge 'number'   the value of number_oid, hidden while it is not above 0
 *   badge 'label'    the text of badge_label
 */
export default class DialogTileWidget<RxData extends Record<string, any>> extends TileWidget<RxData> {
    renderDialogTile(options: {
        badge: 'icon' | 'number' | 'label';
        /** `tile-content` carries `fg-white` as well (only the static dialog tile) */
        fgWhite?: boolean;
        /** raw html after the icon, as `<%== %>` wrote it */
        content?: unknown;
    }): React.JSX.Element {
        const number = this.val(this.attr('number_oid'));

        let badge: React.JSX.Element;
        if (options.badge === 'number') {
            badge = (
                <div
                    style={number > 0 ? undefined : { display: 'none' }}
                    className={`badge ${this.attr('badge_bg_class') ?? ''}`}
                >
                    {number === undefined || number === null ? '' : String(number)}
                </div>
            );
        } else if (options.badge === 'label') {
            badge = (
                <div className={`badge ${this.attr('badge_bg_class') ?? ''}`}>{this.attr('badge_label') ?? ''}</div>
            );
        } else {
            badge = (
                <div className={`badge ${this.attr('badge_bg_class') ?? ''}`}>
                    <i className={this.attr('icon_badge') ?? ''} />
                </div>
            );
        }

        return (
            <div
                style={{ width: '100%', height: '100%' }}
                className={`tile ${this.attr('hover') ? 'hover ' : ''}${this.attr('bg_class') ?? ''}${this.tiltClass()}`}
                {...this.tileHandlers()}
            >
                <div
                    className={`tile-content${options.fgWhite ? ' fg-white' : ''} icon ${this.attr('icon_class') ? '' : 'icon-custom'}`}
                >
                    {' '}
                    {this.img(this.attr('icon_src'), 'icon')} <i className={this.attr('icon_class') ?? ''} />{' '}
                    <RawHtml html={options.content} />{' '}
                </div>
                <div className={`brand ${this.attr('brand_bg_class') ?? ''}`}>
                    {' '}
                    <span className="label fg-white">{this.attr('label') ?? ''}</span> {badge}{' '}
                </div>
            </div>
        );
    }

    /** The dialog of `tileDialogString`: the value of `dialog_oid` in a div with the font, padding and alignment */
    renderStringContent(): React.ReactNode {
        const style: React.CSSProperties = {};
        const fontSize = this.attr('dialog_fontSize');
        const padding = this.attr('dialog_padding');
        const textAlign = this.attr('dialog_textAlign');
        if (fontSize) {
            style.fontSize = fontSize;
        }
        if (padding) {
            style.padding = padding;
        }
        if (textAlign) {
            style.textAlign = textAlign;
        }
        const value = this.val(this.attr('dialog_oid') || '');
        // `if (value === undefined) value = ''` and then a string concatenation - null shows as "null"
        return (
            <div
                style={style}
                className="metro-dialog-string"
                data-oid={this.attr('dialog_oid') || ''}

                dangerouslySetInnerHTML={{ __html: value === undefined ? '' : String(value) }}
            />
        );
    }
}
