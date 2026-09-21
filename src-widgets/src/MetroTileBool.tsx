import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import { colorField, iconField } from './fields';
import { boolSuffix, isTrue, percentStyle } from './utils';
import './styles/metro-palette.css';
import './styles/metro-core.css';

/**
 * Every visual attribute of this widget exists twice, once per state of the boolean. The vis-1 template picked
 * the variant by appending the suffix of `vis.binds.metro.format()` to the attribute name, and the widget data
 * is stored under exactly these names - so they are kept.
 */
interface MetroTileBoolRxData {
    oid: string;
    hover: boolean;
    transform: boolean;
    select_on_true: boolean;
    label_true: string;
    label_false: string;
    bg_class_true: string;
    bg_class_false: string;
    icon_true: string;
    icon_false: string;
    icon_class_true: string;
    icon_class_false: string;
    icon_width: string;
    icon_height: string;
    icon_top: string;
    icon_left: string;
    icon_badge_true: string;
    icon_badge_false: string;
    badge_bg_class_true: string;
    badge_bg_class_false: string;
    badge_src_true: string;
    badge_src_false: string;
    badge_width: string;
    badge_height: string;
    badge_top: string;
    badge_left: string;
    brand_bg_class_true: string;
    brand_bg_class_false: string;
}

/** The direction the tile tilts to while it is pressed. */
type Tilt = 'left' | 'right' | 'top' | 'bottom' | null;

interface MetroTileBoolState extends VisRxWidgetState {
    tilt: Tilt;
}

/**
 * `tplMetroTileBool` - a boolean state as a metro tile.
 *
 * Display only: the vis-1 template bound no click handler, so neither does this one.
 */
export default class MetroTileBool extends Generic<MetroTileBoolRxData, MetroTileBoolState> {
    constructor(props: any) {
        super(props);
        this.state = { ...this.state, tilt: null };
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplMetroTileBool',
            visSet: 'metro',
            visSetLabel: 'set_label',
            visName: 'Tile Bool',
            visWidgetLabel: 'tile_bool',
            visHelp: 'help_tile_bool',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'oid', type: 'id', label: 'oid' },
                        { name: 'hover', type: 'checkbox', label: 'hover', default: true },
                        { name: 'transform', type: 'checkbox', label: 'transform' },
                        { name: 'select_on_true', type: 'checkbox', label: 'select_on_true' },
                        { name: 'label_false', label: 'label_false', default: 'false' },
                        { name: 'label_true', label: 'label_true', default: 'true' },
                        colorField('bg_class_false', 'bg_class_false', 'bg-indigo'),
                        colorField('bg_class_true', 'bg_class_true', 'bg-teal'),
                    ],
                },
                {
                    name: 'icon',
                    label: 'group_icon',
                    fields: [
                        iconField('icon_class_false', 'icon_class_false', 'icon-cancel-2'),
                        iconField('icon_class_true', 'icon_class_true', 'icon-checkmark'),
                        { name: 'icon_false', type: 'image', label: 'icon_false', tooltip: 'icon_src_tooltip' },
                        { name: 'icon_true', type: 'image', label: 'icon_true', tooltip: 'icon_src_tooltip' },
                        { name: 'icon_width', type: 'slider', min: 0, max: 100, step: 1, label: 'icon_width' },
                        { name: 'icon_height', type: 'slider', min: 0, max: 100, step: 1, label: 'icon_height' },
                        { name: 'icon_top', type: 'slider', min: 0, max: 100, step: 1, label: 'icon_top' },
                        { name: 'icon_left', type: 'slider', min: 0, max: 100, step: 1, label: 'icon_left' },
                    ],
                },
                {
                    name: 'badge',
                    label: 'group_badge',
                    fields: [
                        iconField('icon_badge_false', 'icon_badge_false', 'icon-folder-2'),
                        iconField('icon_badge_true', 'icon_badge_true', 'icon-folder'),
                        colorField('badge_bg_class_false', 'badge_bg_class_false', 'bg-cyan', { ribbed: false }),
                        colorField('badge_bg_class_true', 'badge_bg_class_true', 'bg-teal', { ribbed: false }),
                        { name: 'badge_src_false', type: 'image', label: 'badge_src_false' },
                        { name: 'badge_src_true', type: 'image', label: 'badge_src_true' },
                        { name: 'badge_width', type: 'slider', min: 0, max: 100, step: 1, label: 'badge_width' },
                        { name: 'badge_height', type: 'slider', min: 0, max: 100, step: 1, label: 'badge_height' },
                        {
                            name: 'badge_top',
                            type: 'slider',
                            min: 0,
                            max: 100,
                            step: 1,
                            label: 'badge_top',
                            default: 0,
                        },
                        {
                            name: 'badge_left',
                            type: 'slider',
                            min: 0,
                            max: 100,
                            step: 1,
                            label: 'badge_left',
                            default: 0,
                        },
                    ],
                },
                {
                    name: 'brand',
                    label: 'group_brand',
                    fields: [
                        colorField('brand_bg_class_false', 'brand_bg_class_false', 'ribbed-steel'),
                        colorField('brand_bg_class_true', 'brand_bg_class_true', 'ribbed-indigo'),
                    ],
                },
            ],
            visDefaultStyle: {
                width: 136,
                height: 136,
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-metro/img/prev_tile_bool.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileBool.getWidgetInfo();
    }

    /** Reads the variant of `name` that belongs to the current state, e.g. `bg_class` -> `bg_class_true`. */
    private variant(name: string): string {
        const suffix = boolSuffix(this.state.values[`${this.state.rxData.oid}.val`]);
        return (this.state.rxData as unknown as Record<string, string>)[`${name}${suffix}`] || '';
    }

    /**
     * Which way the tile tilts while it is pressed.
     *
     * The vis-1 `tileTransform` jQuery plugin split the tile into thirds: the left third tilts left, the right
     * third right, the lower middle down, everything else up.
     */
    private static tiltOf(event: React.PointerEvent<HTMLDivElement>): Tilt {
        const box = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        if (x < box.width / 3) {
            return 'left';
        }
        if (x > (box.width * 2) / 3) {
            return 'right';
        }
        return y > box.height / 2 ? 'bottom' : 'top';
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData;
        const isOn = boolSuffix(this.state.values[`${data.oid}.val`]) === '_true';
        const iconClass = this.variant('icon_class');
        const iconSrc = this.variant('icon');
        const badgeSrc = this.variant('badge_src');
        const transform = isTrue(data.transform) && !this.state.editMode;

        const tileClasses = [
            'tile',
            isTrue(data.hover) ? 'hover' : '',
            isOn && isTrue(data.select_on_true) ? 'selected' : '',
            this.variant('bg_class'),
            this.state.tilt ? `tile-transform-${this.state.tilt}` : '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                className={this.getRootClass()}
                style={{ width: '100%', height: '100%' }}
            >
                <div
                    className={tileClasses}
                    style={{ width: '100%', height: '100%' }}
                    onPointerDown={transform ? e => this.setState({ tilt: MetroTileBool.tiltOf(e) }) : undefined}
                    onPointerUp={transform ? () => this.setState({ tilt: null }) : undefined}
                    onPointerLeave={transform ? () => this.setState({ tilt: null }) : undefined}
                >
                    {/* `icon-custom` keeps the 56x56 box centred when an image is used instead of a glyph */}
                    <div className={`tile-content icon ${iconClass ? '' : 'icon-custom'}`}>
                        {iconSrc ? (
                            <img
                                src={iconSrc}
                                alt=""
                                style={percentStyle(data, 'icon')}
                            />
                        ) : null}
                        <i className={iconClass} />
                    </div>
                    <div className={`brand ${this.variant('brand_bg_class')}`}>
                        <span className="label fg-white">{this.variant('label')}</span>
                        <div className={`badge ${this.variant('badge_bg_class')}`}>
                            <i className={this.variant('icon_badge')} />
                            {badgeSrc ? (
                                <img
                                    src={badgeSrc}
                                    alt=""
                                    style={percentStyle(data, 'badge')}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
