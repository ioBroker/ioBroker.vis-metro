/*
 * The vis-1 markup of everything metro-core.css styles, for the side-by-side comparison of the preview.
 *
 * Only the React widgets that exist can be compared as widgets. Everything else - switch, checkbox, slider,
 * dialog, the text tiles - is written down here the way the vis-1 templates and the jQuery plugins in
 * widgets/metro/js/metro.js build it, class for class. Each fixture is rendered twice, once under `.metro`
 * (styled by the original metro-bootstrap.css) and once under `.metro-rx` (styled by metro-core.css), so a
 * change of metro-core.css can be checked against vis-1 before the widget that needs it is migrated.
 *
 * `data-force="hover"` (or `active`, `focus`) marks an element whose pseudo class preview/diff.mjs forces through
 * the DevTools protocol - that is the only way to get the hover rules into a screenshot.
 */
import React from 'react';

export type Scope = 'metro' | 'metro-rx';

export interface Fixture {
    /** Id in the report of preview/diff.mjs */
    name: string;
    title: string;
    /** The vis-1 template(s) or plugin the markup comes from */
    source: string;
    width: number;
    height: number;
    /** Clip the box and make it the containing block of `position: fixed` - for the dialogs */
    contain?: boolean;
    render: (scope: Scope) => React.ReactNode;
}

/** The 3px padding every vis-1 metro template gives its widget */
function VisWidget(props: { width: number; height: number; children: React.ReactNode }): React.JSX.Element {
    return <div style={{ width: props.width, height: props.height, padding: 3, boxSizing: 'content-box' }}>{props.children}</div>;
}

/**
 * `tplMetroValueBoolSwitch` / `tplMetroValueBoolCheckbox`. The template puts whitespace between the input, the
 * check and the appended html, which renders as one space - kept, so the text sits where it did.
 */
function InputControl(props: {
    scope: Scope;
    type: 'switch' | 'checkbox';
    checked?: boolean;
    disabled?: boolean;
    force?: string;
    text: string;
}): React.JSX.Element {
    return (
        <div className={props.scope}>
            <div
                className={`input-control ${props.type}`}
                data-force={props.force}
            >
                <label>
                    {' '}
                    <input
                        type="checkbox"
                        checked={!!props.checked}
                        disabled={props.disabled}
                        readOnly
                    />{' '}
                    <span className="check" /> {props.text}{' '}
                </label>
            </div>
        </div>
    );
}

function Row(props: { children: React.ReactNode }): React.JSX.Element {
    return <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', padding: 8 }}>{props.children}</div>;
}

/**
 * `$.metroDialog()`: the overlay carries the scope class itself, the window gets its position and size inline
 * (the plugin centres it with `position: fixed`). The fixture box is the containing block instead of the page.
 */
function Dialog(props: {
    scope: Scope;
    overlay?: boolean;
    shadow?: boolean;
    buttons?: boolean;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div
            className={`${props.scope} window-overlay`}
            style={props.overlay ? { backgroundColor: 'rgba(0,0,0,.7)' } : undefined}
        >
            <div
                className={props.shadow ? 'window shadow' : 'window'}
                style={{
                    position: 'fixed',
                    zIndex: 1050,
                    top: 30,
                    left: 40,
                    width: 340,
                    height: 230,
                    overflow: props.shadow ? 'hidden' : undefined,
                }}
            >
                <div className="caption">
                    <button
                        className="btn-close"
                        type="button"
                    />
                    {props.buttons ? (
                        <>
                            <button
                                className="btn-max"
                                type="button"
                                data-force="hover"
                            />
                            <button
                                className="btn-min"
                                type="button"
                                data-force="focus"
                            />
                        </>
                    ) : null}
                    <span className="icon-home icon" />
                    <div className="title">Living room</div>
                </div>
                <div className="content">{props.children}</div>
            </div>
        </div>
    );
}

/** `metroSlider`: the plugin fills the element with `.complete` and `.marker` and positions them in pixels */
function Slider(props: {
    vertical?: boolean;
    at: number;
    force?: string;
    style?: React.CSSProperties;
}): React.JSX.Element {
    return (
        <div
            className={props.vertical ? 'slider vertical' : 'slider'}
            data-force={props.force}
            style={props.vertical ? { height: '100%', ...props.style } : props.style}
        >
            <div
                className="complete"
                style={props.vertical ? { height: props.at + 12 } : { width: props.at }}
            />
            <a
                className="marker"
                style={props.vertical ? { top: 196 - (props.at + 12) } : { left: props.at }}
            />
        </div>
    );
}

export const FIXTURES: Fixture[] = [
    {
        name: 'switch',
        title: 'Switch - off, on, disabled',
        source: 'tplMetroValueBoolSwitch',
        width: 420,
        height: 56,
        render: scope => (
            <Row>
                <InputControl
                    scope={scope}
                    type="switch"
                    text="Light"
                />
                <InputControl
                    scope={scope}
                    type="switch"
                    checked
                    text="Light"
                />
                <InputControl
                    scope={scope}
                    type="switch"
                    checked
                    disabled
                    text="Light"
                />
            </Row>
        ),
    },
    {
        name: 'checkbox',
        title: 'Checkbox - off, on, disabled, hover',
        source: 'tplMetroValueBoolCheckbox',
        width: 420,
        height: 56,
        render: scope => (
            <Row>
                <InputControl
                    scope={scope}
                    type="checkbox"
                    text="Pump"
                />
                <InputControl
                    scope={scope}
                    type="checkbox"
                    checked
                    text="Pump"
                />
                <InputControl
                    scope={scope}
                    type="checkbox"
                    checked
                    disabled
                    text="Pump"
                />
                <InputControl
                    scope={scope}
                    type="checkbox"
                    force="hover"
                    text="Pump"
                />
            </Row>
        ),
    },
    {
        name: 'slider',
        title: 'Slider - horizontal, and with the pointer over it',
        source: 'tplMetroSlider, metroSlider',
        width: 380,
        height: 60,
        render: scope => (
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[undefined, 'hover'].map(force => (
                    <div
                        key={force || 'plain'}
                        style={{ width: 360, height: 16 }}
                    >
                        <div
                            className={scope}
                            style={{ padding: 2 }}
                        >
                            <Slider
                                at={137.6}
                                force={force}
                            />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        name: 'slider-vertical',
        title: 'Slider - vertical',
        source: 'tplMetroSliderVertical, metroSlider',
        width: 40,
        height: 216,
        render: scope => (
            <div style={{ padding: 8, width: 16, height: 200 }}>
                <div
                    className={scope}
                    style={{ padding: 2, height: '100%', boxSizing: 'border-box' }}
                >
                    <Slider
                        vertical
                        at={73.6}
                    />
                </div>
            </div>
        ),
    },
    {
        name: 'tile-states',
        title: 'Tile - hover, selected, pressed in four directions',
        source: 'tileTransform, every tile template',
        width: 620,
        height: 110,
        render: scope => (
            <Row>
                {[
                    { classes: 'tile hover bg-cyan', force: 'hover' },
                    { classes: 'tile selected bg-cyan' },
                    { classes: 'tile bg-cyan tile-transform-left' },
                    { classes: 'tile bg-cyan tile-transform-right' },
                    { classes: 'tile bg-cyan tile-transform-top' },
                    { classes: 'tile bg-cyan tile-transform-bottom' },
                ].map(tile => (
                    <div
                        key={tile.classes}
                        className={scope}
                        style={{ width: 76, height: 76 }}
                    >
                        <div
                            className={tile.classes}
                            data-force={tile.force}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <div className="tile-content icon">
                                <i className="icon-home" />
                            </div>
                        </div>
                    </div>
                ))}
            </Row>
        ),
    },
    {
        name: 'tile-heating',
        title: 'Tile with text - table, image, slider in the tile, badge with three icons',
        source: 'tplMetroTileHeating',
        width: 310,
        height: 160,
        render: scope => (
            <div style={{ padding: 6 }}>
                <VisWidget
                    width={287}
                    height={136}
                >
                    <div
                        className={scope}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div
                            className="tile hover bg-orange"
                            style={{ width: '100%', height: '100%' }}
                        >
                            <div className="tile-content">
                                <div style={{ float: 'left', height: 90 }}>
                                    <img
                                        width="90px"
                                        src="widgets/metro/img/sani_heating_temp.png"
                                        alt=""
                                    />
                                </div>
                                <div style={{ float: 'right', paddingTop: 16, paddingRight: 12 }}>
                                    <table style={{ color: 'white', fontSize: 11, display: 'inline-block' }}>
                                        <tbody>
                                            <tr>
                                                <td>Set temperature:</td>
                                                <td>21.5°C</td>
                                            </tr>
                                            <tr>
                                                <td>Actual temp.:</td>
                                                <td>20.8°C</td>
                                            </tr>
                                            <tr>
                                                <td>Valve position:</td>
                                                <td>35%</td>
                                            </tr>
                                            <tr>
                                                <td>Humidity:</td>
                                                <td>48%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <Slider
                                    at={90}
                                    style={{ clear: 'both', margin: '0 12px' }}
                                />
                            </div>
                            <div className="brand ribbed-steel">
                                <span className="label fg-white">Living room</span>
                                <div
                                    className="badge bg-cyan"
                                    style={{ width: 57 }}
                                >
                                    <i
                                        className="icon-cog"
                                        style={{ padding: '0 1px' }}
                                    />
                                    <i
                                        className="metro-invisible"
                                        style={{ padding: '0 1px' }}
                                    />
                                    <i
                                        className="icon-power"
                                        style={{ padding: '0 1px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </VisWidget>
            </div>
        ),
    },
    {
        name: 'dialog',
        title: 'Dialog - close button only, text content',
        source: '$.metroDialog, tileDialogString',
        width: 420,
        height: 300,
        contain: true,
        render: scope => (
            <Dialog scope={scope}>
                <div style={{ fontSize: 20, padding: 10, textAlign: 'center' }}>21.5 °C</div>
                Plain text in the content, the way a string dialog shows a state.
            </Dialog>
        ),
    },
    {
        name: 'dialog-full',
        title: 'Dialog - overlay, shadow, max (hover) and min (focus)',
        source: '$.metroDialog',
        width: 420,
        height: 300,
        contain: true,
        render: scope => (
            <Dialog
                scope={scope}
                overlay
                shadow
                buttons
            >
                <div style={{ padding: 10 }}>Content of the dialog</div>
            </Dialog>
        ),
    },
];
