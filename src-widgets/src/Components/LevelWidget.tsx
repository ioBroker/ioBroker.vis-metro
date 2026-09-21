import React from 'react';

import TileWidget from './TileWidget';
import InputControl, { basicChecked, basicCheckboxValue } from './InputControl';
import Slider, { sliderRange, type SliderOptions } from './MetroSlider';
import { numberOr } from '../utils';

/** The images of the vis-1 set; vis-2 serves them from the same place, the set ships both */
export const IMG = 'widgets/metro/img/';

export const IMAGE_BOX: React.CSSProperties = { float: 'left', height: 90 };
const SWITCH_BOX: React.CSSProperties = { margin: '30px 70px 0 0', float: 'right' };
export const SLIDER_BOX: React.CSSProperties = { clear: 'both', margin: '0 12px' };
export const DIALOG_IMAGE_BOX: React.CSSProperties = { textAlign: 'center' };

/**
 * `(val - min) / (max - min)` of the dimmer and shutter templates - with their rules: true is 1 (not max), anything
 * that is no number is 0, a missing min is 0 and a missing max is 1.
 */
export function levelFraction(value: unknown, min: unknown, max: unknown): number {
    let val = parseFloat(value as string);
    if (value === true || value === 'true') {
        val = 1;
    }
    if (isNaN(val)) {
        val = 0;
    }
    const low = numberOr(min, 0);
    const high = numberOr(max, 1);
    return (val - low) / (high - low);
}

/** The lamp of the dimmer templates for a fraction */
export function dimmerImage(fraction: number): string {
    let name = 'light_light_dim.png';
    if (fraction === 1) {
        name = 'light_light_dim_100.png';
    } else if (fraction >= 0.01) {
        const step = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].find(limit => fraction >= limit);
        name = step ? `light_light_dim_${Math.round(step * 100)}.png` : 'light_light_dim_00.png';
    }
    return IMG + name;
}

/** The window of the shutter templates: the fraction turned round, as the shutter closes towards max */
export function shutterImage(fraction: number): string {
    const closed = 1 - fraction;
    let name = 'fts_window_2w.png';
    if (closed === 1) {
        name = 'fts_shutter_100.png';
    } else {
        const step = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].find(limit => closed >= limit);
        if (step) {
            name = `fts_shutter_${Math.round(step * 100)}.png`;
        }
    }
    return IMG + name;
}

/**
 * Base of the dimmer, shutter and heating tiles: the numeric switch (`basic.checkbox(el, true, min, max)`), the
 * slider, and the dialog of `tileDialogSlider` with both.
 */
export default class LevelWidget<RxData extends Record<string, any>> extends TileWidget<RxData> {
    /**
     * What the switch shows while `oid-working` is true: `basic._onChange` leaves the box alone then, so it keeps
     * the state it had - the last one of the value, or the one of the last click. Unchecked if the device was
     * already working when the widget came up.
     */
    private readonly checkedWhileWorking = new Map<string, boolean>();

    renderSwitch(options: {
        oid: string;
        working?: string;
        min: unknown;
        max: unknown;
        bare?: boolean;
    }): React.JSX.Element {
        let checked: boolean;
        if (options.working && this.val(options.working) === true) {
            checked = this.checkedWhileWorking.get(options.oid) ?? false;
        } else {
            checked = basicChecked(this.val(options.oid));
            this.checkedWhileWorking.set(options.oid, checked);
        }
        return (
            <InputControl
                type="switch"
                bare={options.bare}
                checked={checked}
                readOnly={this.state.editMode}
                onChange={value => {
                    this.checkedWhileWorking.set(options.oid, value);
                    this.write(options.oid, basicCheckboxValue(value, true, options.min, options.max));
                }}
            />
        );
    }

    /** The class of the `.tile` div, the same in all these templates */
    tileClass(): string {
        return `tile ${this.attr('hover') ? 'hover ' : ''}${this.attr('bg_class') ?? ''}${this.tiltClass()}`;
    }

    /** The colours of the `slider` group */
    sliderColors(): Pick<SliderOptions, 'color' | 'completeColor' | 'markerColor'> {
        return {
            color: this.attr('sliderColor'),
            completeColor: this.attr('sliderCompleteColor'),
            markerColor: this.attr('sliderMarkerColor'),
        };
    }

    renderSlider(oid: string, options: SliderOptions, style?: React.CSSProperties): React.JSX.Element {
        return (
            <Slider
                value={this.val(oid)}
                options={options}
                style={style}
                disabled={this.state.editMode}
                onChange={value => {
                    // vis-1 wrote NaN when min or max was missing on the dimmer tile; that is no value to write
                    if (typeof value !== 'number' || !isNaN(value)) {
                        this.write(oid, value);
                    }
                }}
            />
        );
    }

    /**
     * The wide tile of the dimmer and the shutter: image, switch, slider, label.
     *
     * @param image   the picture for the value
     * @param working the `oid-working` the switch looks at - the shutter template gave it one, the dimmer not
     * @param slider  the options the template handed to `metro.slider`
     */
    renderLevelTile(image: string, working: string | undefined, slider: SliderOptions): React.JSX.Element {
        const oid = this.attr('oid');
        return (
            <div
                style={{ width: '100%', height: '100%' }}
                className={this.tileClass()}
                {...this.tileHandlers()}
            >
                <div className="tile-content">
                    <div style={IMAGE_BOX}>
                        <img
                            width="90px"
                            src={image}
                            alt=""
                        />
                    </div>
                    <div style={SWITCH_BOX}>
                        {this.renderSwitch({ oid, working, min: this.attr('min'), max: this.attr('max') })}
                    </div>
                    {this.renderSlider(oid, slider, SLIDER_BOX)}
                    <div />
                </div>
                <div className={`brand ${this.attr('brand_bg_class') ?? ''}`}>
                    {' '}
                    <span className="label fg-white">{this.attr('label') ?? ''}</span>{' '}
                </div>
            </div>
        );
    }

    /**
     * The small tile of the dimmer and shutter dialogs: the image in the middle and the label; a click on it opens
     * the dialog of `tileDialogSlider`.
     *
     * @param image      the picture for the value
     * @param imageWidth the `width` attribute of the picture, as the template wrote it
     * @param brand      the class of the brand - the "activ" variant colours it by the value
     */
    renderLevelDialogTile(image: string, imageWidth: string, brand: unknown): React.JSX.Element {
        return (
            <div
                style={{ width: '100%', height: '100%' }}
                className={this.tileClass()}
                {...this.tileHandlers()}
            >
                <div
                    className="tile-content"
                    style={DIALOG_IMAGE_BOX}
                >
                    <img
                        width={imageWidth}
                        src={image}
                        alt=""
                    />
                </div>
                <div className={`brand ${(brand as string) ?? ''}`}>
                    {' '}
                    <span className="label fg-white">{this.attr('label') ?? ''}</span>{' '}
                </div>
            </div>
        );
    }

    /**
     * A dimmer or shutter dialog tile with its dialog (300x180, as the templates fixed it).
     *
     * @param tile   the tile, see renderLevelDialogTile()
     * @param digits the dimmer dialogs hand `digits` to the slider, the shutter dialog does not
     */
    renderLevelDialogWidget(tile: React.JSX.Element, digits: boolean): React.JSX.Element {
        const oid = this.attr('oid') || '';
        const options: SliderOptions = {
            min: this.attr('min'),
            max: this.attr('max'),
            step: parseFloat(this.attr('step')),
            ...this.sliderColors(),
        };
        if (digits) {
            options.digits = this.attr('digits');
        }
        return this.renderFrame(
            <>
                {tile}
                {this.renderDialog(() => this.renderLevelDialogContent(oid, this.attr('oid-working') || '', options), {
                    title: this.attr('label') || '',
                    width: 300,
                    height: 180,
                })}
            </>,
            { padding: 3 },
            { onClick: this.openDialog },
        );
    }

    /**
     * The content of `tileDialogSlider`: a switch and a slider for `oid`, built from strings in vis-1. The switch
     * writes the min and max the dialog parsed for the slider.
     */
    renderLevelDialogContent(oid: string, working: string | undefined, options: SliderOptions): React.ReactNode {
        const { min, max } = sliderRange(options);
        return (
            <>
                <div style={{ margin: '24px 0 0 24px' }}>
                    {this.renderSwitch({ oid, working, min, max, bare: true })}
                </div>
                <div style={{ margin: '24px 12px 0 12px' }}>{this.renderSlider(oid, { ...options, min, max })}</div>
            </>
        );
    }
}
