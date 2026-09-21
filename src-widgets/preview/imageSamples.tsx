/*
 * What the pictures of the widget palette show (`visPrev`, public/img/prev_<tpl>.png): every widget with the
 * defaults of its template, a label and a value that make it recognisable. preview/images.mjs renders them with
 * `?images=1` and screenshots them - `npm run preview:images` after a change of a widget or of the styles.
 */
export interface ImageSample {
    /** widget attributes, on top of the defaults of the template */
    data: Record<string, any>;
    /** state values, as `id.val` */
    values: Record<string, any>;
    /** the size of the picture, if not the default size of the widget */
    width?: number;
    height?: number;
}

export const IMAGES: Record<string, ImageSample> = {
    tplMetroTileBool: { data: { oid: 'p.bool', label_true: 'Light' }, values: { 'p.bool.val': true } },
    tplMetroTileBoolDialog: { data: { oid: 'p.booldialog', label_false: 'Door' }, values: { 'p.booldialog.val': false } },
    tplMetroTileBoolNumber: {
        data: { state_oid: 'p.boolnumber.s', number_oid: 'p.boolnumber.n', label_true: 'Windows ' },
        values: { 'p.boolnumber.s.val': true, 'p.boolnumber.n.val': 3 },
    },
    tplMetroTileString: {
        data: { state_oid: 'p.string.s', content_oid: 'p.string.c', label_id: 'p.string.l' },
        values: { 'p.string.s.val': true, 'p.string.c.val': '21.5°', 'p.string.l.val': 'Temperature' },
    },
    tplMetroTileState: {
        data: { state_oid: 'p.state', value: '1', label_true: 'Lock', icon_class_true: 'icon-unlocked' },
        values: { 'p.state.val': 1 },
    },
    tplMetroTileStateNumber: {
        data: { state_oid: 'p.statenumber.s', value: '1', number_oid: 'p.statenumber.n', label_true: 'Mail' },
        values: { 'p.statenumber.s.val': 1, 'p.statenumber.n.val': 5 },
    },
    tplMetroTileList8: { data: { oid: 'p.list', label1: 'Comfort' }, values: { 'p.list.val': 1 } },
    tplMetroTileToggle: { data: { oid: 'p.toggle', label_true: 'Fan' }, values: { 'p.toggle.val': true } },
    tplMetroTileToggleNumber: {
        data: { oid: 'p.togglenumber', number_oid: 'p.togglenumber.n', label_true: 'Pumps' },
        values: { 'p.togglenumber.val': true, 'p.togglenumber.n.val': 2 },
    },
    tplMetroTileNav: { data: { nav_view: 'other' }, values: {} },
    tplMetroSlider: { data: { oid: 'p.slider' }, values: { 'p.slider.val': 0.6 }, width: 180 },
    tplMetroSliderVertical: { data: { oid: 'p.vslider' }, values: { 'p.vslider.val': 0.4 }, height: 90 },
    tplMetroValueBoolCheckbox: { data: { oid: 'p.checkbox' }, values: { 'p.checkbox.val': true } },
    tplMetroValueBoolSwitch: { data: { oid: 'p.switch' }, values: { 'p.switch.val': true } },
    tplMetroTileDialogStatic: { data: { label: 'Info', html: '-', icon_class: 'icon-home' }, values: {} },
    tplMetroTileStaticDialogNumber: {
        data: { number_oid: 'p.staticnumber', label: 'Messages', html: '-' },
        values: { 'p.staticnumber.val': 4 },
    },
    tplMetroTileDialogString: { data: { label: 'Weather', icon_class: 'icon-film' }, values: {} },
    tplMetroTileStringDialogNumber: {
        data: { number_oid: 'p.stringnumber', label: 'Log' },
        values: { 'p.stringnumber.val': 2 },
    },
    tplMetroTileDialog: { data: { label: 'View' }, values: {} },
    tplMetroTileDialogNumber: {
        // the template has no colour and no icon by default
        data: {
            number_oid: 'p.dialognumber',
            label: 'Alarms',
            bg_class: 'bg-indigo',
            icon_class: 'icon-pictures',
            badge_bg_class: 'bg-teal',
        },
        values: { 'p.dialognumber.val': 7 },
    },
    tplMetroTileFrameDialogNumber: { data: { label: 'Map', badge_label: 'OSM' }, values: {} },
    tplMetroTileDimmer: {
        data: { oid: 'p.dimmer', min: '0', max: '100', label: 'Dimmer' },
        values: { 'p.dimmer.val': 60 },
    },
    tplMetroTileDimmerDialog: {
        data: { oid: 'p.dimmerdialog', min: '0', max: '100', label: 'Dimmer' },
        values: { 'p.dimmerdialog.val': 60 },
    },
    tplMetroTileDimmerDialogactiv: {
        data: { oid: 'p.dimmeractiv', min: '0', max: '100', label: 'Dimmer' },
        values: { 'p.dimmeractiv.val': 60 },
    },
    tplMetroTileShutter: {
        data: { oid: 'p.shutter', min: '0', max: '100', label: 'Shutter' },
        values: { 'p.shutter.val': 40 },
    },
    tplMetroTileShutterDialog: {
        data: { oid: 'p.shutterdialog', min: '0', max: '100', label: 'Shutter' },
        values: { 'p.shutterdialog.val': 40 },
    },
    tplMetroTileHeating: {
        data: { set_oid: 'p.heating.set', temp_oid: 'p.heating.temp', drive_oid: 'p.heating.drive', label: 'Heating' },
        values: { 'p.heating.set.val': 21, 'p.heating.temp.val': 20.5, 'p.heating.drive.val': 40 },
    },
    tplMetroTileHeatingDialog: {
        data: { set_oid: 'p.heatingdialog.set', temp_oid: 'p.heatingdialog.temp', label: 'Heating' },
        values: { 'p.heatingdialog.set.val': 21, 'p.heatingdialog.temp.val': 20.5 },
    },
};
