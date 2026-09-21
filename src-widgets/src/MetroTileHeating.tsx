import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { IMAGE_BOX, IMG, SLIDER_BOX } from './Components/LevelWidget';
import RawHtml from './Components/RawHtml';
import { onHeatingOid } from './Components/onHeatingOid';
import { widgetInfo } from './info';
import { asText, metroFormat } from './utils';

const TPL = 'tplMetroTileHeating';

const TABLE_BOX: React.CSSProperties = { float: 'right', paddingTop: 16, paddingRight: 12 };
const TABLE: React.CSSProperties = { color: 'white', fontSize: 11, display: 'inline-block' };
const BADGE_ICON: React.CSSProperties = { padding: '0 1px' };
const HIDDEN_SLIDER: React.CSSProperties = { ...SLIDER_BOX, display: 'none' };

/** `<%= %>`: nothing for undefined and null */
function text(value: unknown): string {
    return value === undefined || value === null ? '' : asText(value);
}

/** The test of the low battery and open window icons */
function isOn(value: any): boolean {
    return value === true || value === 'true' || value == 1;
}

/**
 * `tplMetroTileHeating` - a wide tile with set point, actual temperature, valve and humidity, a slider for the
 * set point (6...30 unless `min`/`max` say otherwise, steps of 0.1 unless `step` does) and in the badge the icons
 * of control mode, low battery and open window.
 *
 * Each line and icon is there only when its state is chosen; without `set_oid` the slider is hidden. Choosing a
 * set point in the editor fills the other states of the thermostat (see onHeatingOid).
 */
export default class MetroTileHeating extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 287, height: 136 }, { onChange: { onHeatingOid } });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileHeating.getWidgetInfo();
    }

    renderRow(oid: string, label: string, fallback: string, type: '°' | '%'): React.JSX.Element | null {
        if (!this.attr(oid)) {
            return null;
        }
        return (
            <tr>
                <td>
                    <RawHtml html={this.attr(label) ? this.attr(label) : LevelWidget.word(fallback)} />:
                </td>
                <td>{text(metroFormat(this.val(this.attr(oid)), type))}</td>
            </tr>
        );
    }

    renderBadge(): React.JSX.Element | null {
        const icons: React.ReactNode[] = [];
        const controlMode = this.attr('controlmode_oid');
        if (controlMode) {
            icons.push(
                ' ',
                <i
                    key="mode"
                    className={text(this.attr(`icon_control_mode_${this.val(controlMode)}`))}
                    style={BADGE_ICON}
                />,
            );
        }
        const lowBat = this.attr('lowbat_oid');
        if (lowBat) {
            icons.push(
                ' ',
                <i
                    key="bat"
                    className={isOn(this.val(lowBat)) ? text(this.attr('icon_lowbat')) : 'metro-invisible'}
                    style={BADGE_ICON}
                />,
            );
        }
        const windowOpen = this.attr('windowopen_oid');
        if (windowOpen) {
            icons.push(
                ' ',
                <i
                    key="window"
                    className={isOn(this.val(windowOpen)) ? text(this.attr('icon_windowopen')) : 'metro-invisible'}
                    style={BADGE_ICON}
                />,
            );
        }
        if (!icons.length) {
            return null;
        }
        // `size_badge`: one icon is 19px wide
        const width = (icons.length / 2) * 19;
        icons.push(' ');
        return (
            <div
                className={`badge ${this.attr('badge_bg_class') ?? ''}`}
                style={{ width }}
            >
                {icons}
            </div>
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const setOid = this.attr('set_oid');
        const min = this.attr('min');
        const max = this.attr('max');
        const slider = this.renderSlider(
            setOid,
            {
                ...this.sliderColors(),
                max: max === '' || max === undefined || max === null ? 30 : max,
                min: min === '' || min === undefined || min === null ? 6 : min,
                step: parseFloat(this.attr('step')) || 0.1,
            },
            // `hideIfNoOid`
            setOid ? SLIDER_BOX : HIDDEN_SLIDER,
        );

        return this.renderFrame(
            <div
                style={{ width: '100%', height: '100%' }}
                className={this.tileClass()}
                {...this.tileHandlers()}
            >
                <div className="tile-content">
                    <div style={IMAGE_BOX}>
                        <img
                            width="90px"
                            src={`${IMG}sani_heating_temp.png`}
                            alt=""
                        />
                    </div>
                    <div style={TABLE_BOX}>
                        <table style={TABLE}>
                            <tbody>
                                {this.renderRow('set_oid', 'label_set', 'Set temperature', '°')}
                                {this.renderRow('temp_oid', 'label_temp', 'Actual temp.', '°')}
                                {this.renderRow('drive_oid', 'label_drive', 'Valve position', '%')}
                                {this.renderRow('hum_oid', 'label_humidity', 'Humidity', '%')}
                            </tbody>
                        </table>
                    </div>
                    {slider}
                    <div />
                </div>
                <div className={`brand ${this.attr('brand_bg_class') ?? ''}`}>
                    {' '}
                    <span className="label fg-white">{this.attr('label') ?? ''}</span> {this.renderBadge()}{' '}
                </div>
            </div>,
        );
    }
}
