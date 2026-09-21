/*
 * The widgets of the comparison: each case is rendered by the vis-1 template (preview/vis1.ts) and by the React
 * widget with the same attributes and state values, and preview/diff.mjs compares the two pixel by pixel.
 *
 * The cases aim at the corners of the templates - the string "false", a number state of null, the raw value
 * `true` in the value list, an active and an inactive navigation - because that is where a port goes wrong.
 * Every case has object ids of its own: the states of the vis-1 runtime are global.
 */
export interface Case {
    name: string;
    tpl: string;
    width: number;
    height: number;
    /** widget attributes, on top of the defaults of the template */
    data: Record<string, any>;
    /** state values, as `id.val` */
    values: Record<string, any>;
    /** a dialog tile: preview/diff.mjs also opens the dialog (`?dialog=name`) and compares it */
    dialog?: boolean;
    /**
     * Clicks for the comparison of the behaviour (`?click=name`): preview/diff.mjs clicks the vis-1 template and
     * the React widget at the same places, one after the other, and compares what they wrote, which URLs they
     * called and which views they opened. The widget sees its own writes, as in a running vis.
     */
    clicks?: Click[];
}

/**
 * Where to click: in the element `selector` inside the widget (the widget itself without one) - or, with
 * `global`, anywhere on the page, for the content of an open dialog - at the fractions `x`/`y` of its box
 * (default: the middle).
 */
export interface Click {
    selector?: string;
    global?: boolean;
    x?: number;
    y?: number;
}

const center: Click = {};
const check: Click = { selector: '.check' };

const tile = { width: 136, height: 136 };
const wide = { width: 287, height: 136 };

export const CASES: Case[] = [
    {
        name: 'string-false',
        tpl: 'tplMetroTileString',
        ...tile,
        data: {
            state_oid: 's1.state',
            content_oid: 's1.content',
            label_id: 's1.label',
            content_prepend: 'T: ',
            label_append: '!',
        },
        values: { 's1.state.val': false, 's1.content.val': '21.5 °C', 's1.label.val': 'Living room' },
    },
    {
        name: 'string-true',
        tpl: 'tplMetroTileString',
        ...tile,
        data: { state_oid: 's2.state', content_oid: 's2.content', label_id: 's2.label', select_on_true: true },
        values: { 's2.state.val': true, 's2.content.val': 42, 's2.label.val': '<b>bold</b> label' },
    },
    {
        name: 'boolnumber-false',
        tpl: 'tplMetroTileBoolNumber',
        ...tile,
        data: { state_oid: 'bn1.state', number_oid: 'bn1.num', label_false: 'Off ', label_append: ' W' },
        values: { 'bn1.state.val': false, 'bn1.num.val': 42 },
    },
    {
        name: 'boolnumber-null',
        tpl: 'tplMetroTileBoolNumber',
        ...tile,
        data: { state_oid: 'bn2.state', number_oid: 'bn2.num', label_true: 'On ', select_on_true: true },
        values: { 'bn2.state.val': true, 'bn2.num.val': null },
    },
    {
        name: 'state-match',
        tpl: 'tplMetroTileState',
        ...tile,
        data: {
            state_oid: 'st1.s',
            value: '2',
            select_on_value: true,
            label_true: 'Day',
            label_false: 'Night',
            icon_class_true: 'icon-sun-3',
            icon_class_false: 'icon-weather-4',
        },
        values: { 'st1.s.val': 2 },
    },
    {
        name: 'state-other',
        tpl: 'tplMetroTileState',
        ...tile,
        data: { state_oid: 'st2.s', value: '5', label_true: 'Day', label_false: 'Night', icon_class_false: 'icon-weather-4' },
        values: { 'st2.s.val': true },
    },
    {
        name: 'statenumber',
        tpl: 'tplMetroTileStateNumber',
        ...tile,
        data: { state_oid: 'sn1.s', value: 'true', number_oid: 'sn1.n', label_true: 'Alarms', label_append: ':' },
        values: { 'sn1.s.val': true, 'sn1.n.val': 7 },
    },
    {
        name: 'statenumber-null',
        tpl: 'tplMetroTileStateNumber',
        ...tile,
        data: { state_oid: 'sn2.s', value: '1', number_oid: 'sn2.n', label_false: 'Alarms' },
        values: { 'sn2.s.val': 0, 'sn2.n.val': null },
    },
    {
        name: 'list-3',
        tpl: 'tplMetroTileList8',
        ...tile,
        data: { oid: 'l1.v', label3: 'Three', bg_class3: 'bg-orange', icon_class3: 'icon-home', icon_badge3: 'icon-cog' },
        values: { 'l1.v.val': 3 },
    },
    {
        name: 'list-true',
        tpl: 'tplMetroTileList8',
        ...tile,
        data: { oid: 'l2.v', label_prepend: '[', label_append: ']', label1: 'One', bg_class1: 'bg-green' },
        values: { 'l2.v.val': true },
    },
    {
        name: 'toggle-false',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 't1.v', label_false: 'Off', label_true: 'On' },
        values: { 't1.v.val': false },
    },
    {
        name: 'toggle-string-false',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 't2.v', label_false: 'Off', label_true: 'On', select_on_true: true },
        values: { 't2.v.val': 'false' },
    },
    {
        name: 'togglenumber',
        tpl: 'tplMetroTileToggleNumber',
        ...tile,
        data: { oid: 'tn1.v', number_oid: 'tn1.n', badge_bg_class: 'bg-red', label_true: 'Lights' },
        values: { 'tn1.v.val': true, 'tn1.n.val': 3 },
    },
    {
        name: 'togglenumber-0',
        tpl: 'tplMetroTileToggleNumber',
        ...tile,
        data: { oid: 'tn2.v', number_oid: 'tn2.n', badge_bg_class: 'bg-red', label_false: 'Lights' },
        values: { 'tn2.v.val': false, 'tn2.n.val': 0 },
    },
    {
        name: 'nav-active',
        tpl: 'tplMetroTileNav',
        ...tile,
        data: { nav_view: 'preview', select_current: true, label: 'Home' },
        values: {},
    },
    {
        name: 'nav-inactive',
        tpl: 'tplMetroTileNav',
        ...tile,
        data: { nav_view: 'other', label: 'Other' },
        values: {},
    },
    {
        name: 'slider-40',
        tpl: 'tplMetroSlider',
        width: 360,
        height: 16,
        data: { oid: 'sl1.v', min: '0', max: '100' },
        values: { 'sl1.v.val': 40 },
    },
    {
        name: 'slider-true',
        tpl: 'tplMetroSlider',
        width: 360,
        height: 16,
        // no max: vis-1 falls back to 1, and true is max
        data: { oid: 'sl2.v' },
        values: { 'sl2.v.val': true },
    },
    {
        name: 'slider-colors',
        tpl: 'tplMetroSlider',
        width: 240,
        height: 16,
        data: { oid: 'sl3.v', sliderCompleteColor: '#ff0000', sliderMarkerColor: '#00aa00', sliderColor: '#0000ff' },
        values: { 'sl3.v.val': 0.25 },
    },
    {
        name: 'slider-vertical',
        tpl: 'tplMetroSliderVertical',
        width: 16,
        height: 200,
        data: { oid: 'sv1.v', min: '0', max: '100' },
        values: { 'sv1.v.val': 70 },
    },
    {
        name: 'checkbox-on',
        tpl: 'tplMetroValueBoolCheckbox',
        width: 140,
        height: 44,
        data: { oid: 'cb1.v', html_prepend: 'Pump', html_append: '<b>on</b>' },
        values: { 'cb1.v.val': true },
    },
    {
        name: 'checkbox-string-0',
        tpl: 'tplMetroValueBoolCheckbox',
        width: 60,
        height: 40,
        data: { oid: 'cb2.v' },
        values: { 'cb2.v.val': '0' },
    },
    {
        name: 'switch-on',
        tpl: 'tplMetroValueBoolSwitch',
        width: 140,
        height: 44,
        data: { oid: 'sw1.v', html_append: 'Light' },
        values: { 'sw1.v.val': 'true' },
    },
    {
        name: 'switch-off',
        tpl: 'tplMetroValueBoolSwitch',
        width: 60,
        height: 40,
        data: { oid: 'sw2.v' },
        values: { 'sw2.v.val': false },
    },
    {
        name: 'booldialog',
        tpl: 'tplMetroTileBoolDialog',
        ...tile,
        dialog: true,
        data: { oid: 'bd1.v', contains_view: 'view2', dialog_title: 'Bool <i>view</i>', dialog_modal: true, dialog_shadow: true },
        values: { 'bd1.v.val': true },
    },
    {
        name: 'dialogstatic',
        tpl: 'tplMetroTileDialogStatic',
        ...tile,
        dialog: true,
        data: {
            content_oid: 'ds1.c',
            label: 'Static',
            icon_class: 'icon-home',
            icon_badge: 'icon-cog',
            badge_bg_class: 'bg-cyan',
            html: '<p style="margin: 8px">Fixed <b>html</b></p>',
            dialog_title: 'Static',
            dialog_width: '320',
            dialog_height: '240px',
            dialog_icon_class: 'icon-home',
        },
        values: { 'ds1.c.val': 'Hi' },
    },
    {
        name: 'staticdialognumber',
        tpl: 'tplMetroTileStaticDialogNumber',
        ...tile,
        dialog: true,
        data: { number_oid: 'sdn.n', label: 'Mails', badge_bg_class: 'bg-red', html: 'Text', dialog_flat: true },
        values: { 'sdn.n.val': 5 },
    },
    {
        name: 'dialogstring',
        tpl: 'tplMetroTileDialogString',
        ...tile,
        dialog: true,
        data: {
            content_oid: 'dstr.c',
            dialog_oid: 'dstr.d',
            label: 'Weather',
            dialog_fontSize: '20px',
            dialog_padding: '10px',
            dialog_textAlign: 'center',
            dialog_width: '300',
            dialog_height: '220',
        },
        values: { 'dstr.c.val': 18, 'dstr.d.val': 'Sunny, <b>18 °C</b>' },
    },
    {
        name: 'stringdialognumber',
        tpl: 'tplMetroTileStringDialogNumber',
        ...tile,
        dialog: true,
        data: { dialog_oid: 'sdn2.d', number_oid: 'sdn2.n', label: 'Log' },
        values: { 'sdn2.d.val': null, 'sdn2.n.val': 0 },
    },
    {
        name: 'tiledialog',
        tpl: 'tplMetroTileDialog',
        ...tile,
        dialog: true,
        data: { contains_view: 'view2', label: 'View', dialog_title: 'A view', dialog_width: '400', dialog_height: '300' },
        values: {},
    },
    {
        name: 'dialognumber',
        tpl: 'tplMetroTileDialogNumber',
        ...tile,
        dialog: true,
        data: { contains_view: 'view2', number_oid: 'dn.n', label: 'Count', badge_bg_class: 'bg-teal', dialog_draggable: false },
        values: { 'dn.n.val': 12 },
    },
    {
        name: 'framedialog',
        tpl: 'tplMetroTileFrameDialogNumber',
        ...tile,
        dialog: true,
        data: { content: '<b>map</b>', label: 'Map', badge_label: 'OSM', badge_bg_class: 'bg-orange', dialog_url: 'about:blank' },
        values: {},
    },
    {
        name: 'dimmer',
        tpl: 'tplMetroTileDimmer',
        ...wide,
        data: { oid: 'dm1.v', min: '0', max: '100', hover: true, label: 'Living <room>', sliderCompleteColor: '#40c040' },
        values: { 'dm1.v.val': 55 },
    },
    {
        // no min and max: the slider gets NaN and places nothing; true lights the lamp fully
        name: 'dimmer-nan',
        tpl: 'tplMetroTileDimmer',
        ...wide,
        data: { oid: 'dm2.v', label: 'Hall' },
        values: { 'dm2.v.val': true },
    },
    {
        name: 'dimmer-low',
        tpl: 'tplMetroTileDimmer',
        ...wide,
        data: { oid: 'dm3.v', min: '0', max: '1', step: '0.01', sliderColor: '#303030', sliderMarkerColor: '#e0e000' },
        values: { 'dm3.v.val': '0.005' },
    },
    {
        name: 'shutter',
        tpl: 'tplMetroTileShutter',
        ...wide,
        data: { oid: 'sh1.v', min: '0', max: '100', label: 'Kitchen', brand_bg_class: 'bg-darkBlue' },
        values: { 'sh1.v.val': 0 },
    },
    {
        // working from the start: the switch stays unchecked although the value is true
        name: 'shutter-working',
        tpl: 'tplMetroTileShutter',
        ...wide,
        data: { oid: 'sh2.v', 'oid-working': 'sh2.w', min: '0', max: '100', bg_class: 'bg-teal' },
        values: { 'sh2.v.val': 70, 'sh2.w.val': true },
    },
    {
        name: 'heating',
        tpl: 'tplMetroTileHeating',
        ...wide,
        data: {
            set_oid: 'ht1.set',
            temp_oid: 'ht1.temp',
            drive_oid: 'ht1.drive',
            hum_oid: 'ht1.hum',
            controlmode_oid: 'ht1.mode',
            lowbat_oid: 'ht1.bat',
            windowopen_oid: 'ht1.win',
            badge_bg_class: 'bg-red',
            label_set: '<i>Soll</i>',
            label: 'Bath',
        },
        values: {
            'ht1.set.val': 21.5,
            'ht1.temp.val': '20.25',
            'ht1.drive.val': 35,
            'ht1.hum.val': null,
            'ht1.mode.val': 1,
            'ht1.bat.val': 'true',
            'ht1.win.val': false,
        },
    },
    {
        // no set point: the slider is hidden and there is no badge
        name: 'heating-min',
        tpl: 'tplMetroTileHeating',
        ...wide,
        data: { temp_oid: 'ht2.temp', windowopen_oid: 'ht2.win', transform: true },
        values: { 'ht2.temp.val': 19, 'ht2.win.val': 1 },
    },
    {
        name: 'dimmerdialog',
        tpl: 'tplMetroTileDimmerDialog',
        ...tile,
        dialog: true,
        data: {
            oid: 'dd1.v',
            min: '0',
            max: '100',
            step: '5',
            digits: '1',
            label: 'Dimmer',
            dialog_modal: true,
            dialog_shadow: true,
            sliderMarkerColor: '#e0e000',
        },
        values: { 'dd1.v.val': 42 },
    },
    {
        name: 'dimmerdialogactiv',
        tpl: 'tplMetroTileDimmerDialogactiv',
        ...tile,
        dialog: true,
        data: { oid: 'dda1.v', label: 'Off', dialog_flat: true },
        values: { 'dda1.v.val': 0 },
    },
    {
        name: 'dimmerdialogactiv-on',
        tpl: 'tplMetroTileDimmerDialogactiv',
        ...tile,
        data: { oid: 'dda2.v', min: '0', max: '255', label: 'On' },
        values: { 'dda2.v.val': 128 },
    },
    {
        name: 'shutterdialog',
        tpl: 'tplMetroTileShutterDialog',
        ...tile,
        dialog: true,
        data: { oid: 'shd.v', 'oid-working': 'shd.w', min: '0', max: '100', label: 'Blind' },
        values: { 'shd.v.val': 30, 'shd.w.val': false },
    },
    {
        name: 'heatingdialog',
        tpl: 'tplMetroTileHeatingDialog',
        ...tile,
        dialog: true,
        data: {
            set_oid: 'hd1.set',
            temp_oid: 'hd1.temp',
            drive_oid: 'hd1.drive',
            label: 'Bath',
            label_short_set: 'S',
            label_temp: '<b>Now</b>',
            dialog_modal: true,
        },
        values: { 'hd1.set.val': 22, 'hd1.temp.val': 21.34, 'hd1.drive.val': 60 },
    },
    {
        // the line on the tile concatenates: null shows as "null"
        name: 'heatingdialog-null',
        tpl: 'tplMetroTileHeatingDialog',
        ...tile,
        data: { temp_oid: 'hd2.temp', drive_oid: 'hd2.drive' },
        values: { 'hd2.temp.val': null, 'hd2.drive.val': 7 },
    },

    // ------------------------------------------------------------------------------------- behaviour only
    {
        name: 'click-toggle',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 'ck1.v' },
        values: { 'ck1.v.val': false },
        clicks: [center, center, center],
    },
    {
        // a number: 0.7 -> 0 -> 1 -> 0
        name: 'click-toggle-number',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 'ck2.v' },
        values: { 'ck2.v.val': 0.7 },
        clicks: [center, center, center],
    },
    {
        name: 'click-toggle-string',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 'ck3.v' },
        values: { 'ck3.v.val': 'false' },
        clicks: [center, center],
    },
    {
        // the value decides which of the two states is written, and it does not change
        name: 'click-toggle-oidtrue',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oid: 'ck4.v', oidTrue: 'ck4.t', oidFalse: 'ck4.f', oidTrueValue: '42', oidFalseValue: 'false' },
        values: { 'ck4.v.val': 1 },
        clicks: [center, center],
    },
    {
        // no oid: the widget remembers the state itself and calls the two URLs by turns
        name: 'click-toggle-url',
        tpl: 'tplMetroTileToggle',
        ...tile,
        data: { oidTrue: 'ck5.t', urlTrue: 'http://example.invalid/on', urlFalse: 'http://example.invalid/off' },
        values: {},
        clicks: [center, center, center],
    },
    {
        name: 'click-togglenumber',
        tpl: 'tplMetroTileToggleNumber',
        ...tile,
        data: { oid: 'ck6.v', number_oid: 'ck6.n' },
        values: { 'ck6.v.val': true, 'ck6.n.val': 3 },
        clicks: [center, center],
    },
    {
        name: 'click-state-number',
        tpl: 'tplMetroTileState',
        ...tile,
        data: { state_oid: 'ck7.v', value: '5' },
        values: { 'ck7.v.val': 0 },
        clicks: [center],
    },
    {
        // "01" does not print as the number it is: it is written as a string
        name: 'click-state-string',
        tpl: 'tplMetroTileState',
        ...tile,
        data: { state_oid: 'ck8.v', value: '01' },
        values: { 'ck8.v.val': 0 },
        clicks: [center],
    },
    {
        name: 'click-state-unset',
        tpl: 'tplMetroTileState',
        ...tile,
        data: { state_oid: 'ck9.v' },
        values: { 'ck9.v.val': 1 },
        clicks: [center],
    },
    {
        name: 'click-statenumber',
        tpl: 'tplMetroTileStateNumber',
        ...tile,
        data: { state_oid: 'ck10.v', value: 'false', number_oid: 'ck10.n' },
        values: { 'ck10.v.val': true, 'ck10.n.val': 1 },
        clicks: [center],
    },
    {
        name: 'click-checkbox',
        tpl: 'tplMetroValueBoolCheckbox',
        width: 60,
        height: 40,
        data: { oid: 'ck11.v' },
        values: { 'ck11.v.val': false },
        clicks: [check, check, check],
    },
    {
        name: 'click-switch',
        tpl: 'tplMetroValueBoolSwitch',
        width: 60,
        height: 40,
        data: { oid: 'ck12.v' },
        values: { 'ck12.v.val': 'true' },
        clicks: [check, check],
    },
    {
        // the switch writes max and min, the slider values between them
        name: 'click-dimmer',
        tpl: 'tplMetroTileDimmer',
        ...wide,
        data: { oid: 'ck13.v', min: '10', max: '90' },
        values: { 'ck13.v.val': 0 },
        clicks: [check, check, { selector: '.slider', x: 0.3 }, { selector: '.slider', x: 0.85 }],
    },
    {
        // the switch writes although the device is working
        name: 'click-shutter',
        tpl: 'tplMetroTileShutter',
        ...wide,
        data: { oid: 'ck14.v', 'oid-working': 'ck14.w', min: '0', max: '100', step: '5' },
        values: { 'ck14.v.val': 50, 'ck14.w.val': true },
        clicks: [check, { selector: '.slider', x: 0.62 }],
    },
    {
        name: 'click-heating',
        tpl: 'tplMetroTileHeating',
        ...wide,
        data: { set_oid: 'ck15.s' },
        values: { 'ck15.s.val': 21 },
        clicks: [{ selector: '.slider', x: 0.5 }, { selector: '.slider', x: 0.07 }],
    },
    {
        name: 'click-slider',
        tpl: 'tplMetroSlider',
        width: 360,
        height: 16,
        data: { oid: 'ck16.v', min: '0', max: '100', step: '5' },
        values: { 'ck16.v.val': 20 },
        clicks: [{ selector: '.slider', x: 0.62 }, { selector: '.slider', x: 0.02 }],
    },
    {
        name: 'click-slider-vertical',
        tpl: 'tplMetroSliderVertical',
        width: 16,
        height: 360,
        data: { oid: 'ck17.v', min: '-10', max: '10' },
        values: { 'ck17.v.val': 0 },
        clicks: [{ selector: '.slider', y: 0.25 }],
    },
    {
        name: 'click-nav',
        tpl: 'tplMetroTileNav',
        ...tile,
        data: { nav_view: 'view2' },
        values: {},
        clicks: [center],
    },
    {
        // open the dialog, then the switch and the slider in it; `digits` makes the slider write strings
        name: 'click-dimmerdialog',
        tpl: 'tplMetroTileDimmerDialog',
        ...tile,
        data: { oid: 'ck18.v', min: '0', max: '100', digits: '1' },
        values: { 'ck18.v.val': 0 },
        clicks: [
            center,
            { selector: '.window .check', global: true },
            { selector: '.window .slider', global: true, x: 0.4 },
        ],
    },
    {
        name: 'click-heatingdialog',
        tpl: 'tplMetroTileHeatingDialog',
        ...tile,
        data: { set_oid: 'ck19.s', temp_oid: 'ck19.t' },
        values: { 'ck19.s.val': 20, 'ck19.t.val': 19.5 },
        clicks: [center, { selector: '.window .slider', global: true, x: 0.75 }],
    },
];
