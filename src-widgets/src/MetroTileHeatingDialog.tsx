import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import LevelWidget, { DIALOG_IMAGE_BOX, IMG } from './Components/LevelWidget';
import RawHtml from './Components/RawHtml';
import { onHeatingOid } from './Components/onHeatingOid';
import { widgetInfo } from './info';
import { metroFormat } from './utils';

const TPL = 'tplMetroTileHeatingDialog';

const SHORT_TEXT: React.CSSProperties = { color: 'white', fontSize: 11, marginTop: 84, paddingLeft: 12 };
const SLIDER_BOX: React.CSSProperties = { margin: '24px 12px 0 12px' };
const TABLE: React.CSSProperties = { marginTop: 12, marginLeft: 12, fontSize: 14, display: 'inline-block' };

/**
 * A value of the dialog with `digits` decimals, nothing while there is none.
 *
 * vis-1 called `toFixed()` on the state itself when the dialog opened, which threw for a state that is a string
 * (or a boolean): the dialog came up empty and at its full size. The port shows what vis-1 showed as soon as such
 * a state changed, `parseFloat(value).toFixed(digits)`.
 */
function fixed(value: unknown, digits: number): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    return typeof value === 'number' ? value.toFixed(digits) : parseFloat(value as string).toFixed(digits);
}

/**
 * `tplMetroTileHeatingDialog` - a tile with the thermostat and a short line of set point, actual temperature and
 * valve; a click opens a dialog with a slider for the set point and the three values (`tileDialogHeating` of
 * vis-1).
 *
 * Kept from vis-1:
 * - the line on the tile concatenates the values, so a state that is null shows as "null";
 * - the default label of the set point in the dialog, "Set temperature", is not translated (the two others are).
 */
export default class MetroTileHeatingDialog extends LevelWidget<Record<string, any>> {
    static getWidgetInfo(): RxWidgetInfo {
        return widgetInfo(TPL, { width: 136, height: 136 }, { onChange: { onHeatingOid } });
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return MetroTileHeatingDialog.getWidgetInfo();
    }

    /** One part of the line on the tile, `(label ? label : _(fallback)) + ': ' + format(value, type)` */
    shortText(oid: string, label: string, fallback: string, type: '°' | '%', space: string): string {
        if (!this.attr(oid)) {
            return '';
        }
        const name = this.attr(label) ? this.attr(label) : LevelWidget.word(fallback);
        return `${space}${name}: ${metroFormat(this.val(this.attr(oid)), type)}`;
    }

    renderDialogContent(): React.ReactNode {
        const setOid = this.attr('set_oid') || '';
        const tempOid = this.attr('temp_oid') || '';
        const driveOid = this.attr('drive_oid') || '';
        const min = this.attr('min');
        const max = this.attr('max');
        return (
            <>
                <div style={SLIDER_BOX}>
                    {setOid
                        ? this.renderSlider(setOid, {
                              ...this.sliderColors(),
                              max: max === undefined ? 30 : parseFloat(max),
                              min: min === undefined ? 6 : parseFloat(min),
                              step: parseFloat(this.attr('step')),
                          })
                        : null}
                </div>
                <table style={TABLE}>
                    <tbody>
                        {setOid ? (
                            <tr>
                                <td>
                                    <RawHtml html={this.attr('label_set') || 'Set temperature'} />:
                                </td>
                                <td>
                                    <span
                                        className="metro-dialog-string"
                                        data-oid={setOid}
                                    >
                                        {fixed(this.val(setOid), 1)}
                                    </span>
                                    °C
                                </td>
                            </tr>
                        ) : null}
                        {tempOid ? (
                            <tr>
                                <td>
                                    <RawHtml html={this.attr('label_temp') || LevelWidget.word('Actual temp.')} />:
                                </td>
                                <td>
                                    <span
                                        className="metro-dialog-string"
                                        data-oid={tempOid}
                                    >
                                        {fixed(this.val(tempOid), 1)}
                                    </span>
                                    °C
                                </td>
                            </tr>
                        ) : null}
                        {driveOid ? (
                            <tr>
                                <td>
                                    <RawHtml html={this.attr('label_drive') || LevelWidget.word('Valve position')} />:
                                </td>
                                <td>
                                    <span
                                        className="metro-dialog-string"
                                        data-oid={driveOid}
                                    >
                                        {fixed(this.val(driveOid), 0)}
                                    </span>
                                    %
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </>
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        return this.renderFrame(
            <>
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
                            width="105px"
                            src={`${IMG}sani_heating_temp.png`}
                            alt=""
                        />
                    </div>
                    <div style={SHORT_TEXT}>
                        {' '}
                        <RawHtml html={this.shortText('set_oid', 'label_short_set', 'Target', '°', '')} />{' '}
                        <RawHtml html={this.shortText('temp_oid', 'label_short_temp', 'Actual', '°', ' ')} />{' '}
                        <RawHtml
                            html={this.shortText('drive_oid', 'label_short_drive', 'Valve position', '%', ' ')}
                        />{' '}
                    </div>
                    <div className={`brand ${this.attr('brand_bg_class') ?? ''}`}>
                        {' '}
                        <span className="label fg-white">{this.attr('label') ?? ''}</span>{' '}
                    </div>
                </div>
                {this.renderDialog(() => this.renderDialogContent(), {
                    title: this.attr('label') || '',
                    width: 300,
                    height: 180,
                })}
            </>,
            { padding: 3 },
            { onClick: this.openDialog },
        );
    }
}
