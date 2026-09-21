import React, { type CSSProperties } from 'react';

/**
 * The slider of the metro set: `vis.binds.metro.slider` of widgets/metro.html on top of the `metroSlider` jQuery
 * plugin of widgets/metro/js/metro.js, ported as one.
 *
 * The binding maps the state onto the 0...100 of the plugin: `min`/`max` (with the fallbacks of vis-1: missing
 * min is 0, missing max is 1), true is max, false is min, and the position is `floor((value - min) * 100 /
 * (max - min))`. The plugin places marker and filled part in pixels: `length` is the width (or height) of the
 * slider, the marker is 12px, and a position p sits at `p * (length - 12) / 100`.
 *
 * Dragging writes on every move, as vis-1 did - `round(p) / factor + min`, rounded to `step`, formatted with
 * `digits`. While the pointer is down, new values of the state do not move the marker; after the release it
 * stays where it was let go until the state changes.
 */
export interface SliderOptions {
    /** the raw attributes, as the template handed them to the binding */
    min?: unknown;
    max?: unknown;
    step?: unknown;
    digits?: unknown;
    color?: string;
    completeColor?: string;
    markerColor?: string;
}

interface MetroSliderProps {
    value: unknown;
    options: SliderOptions;
    vertical?: boolean;
    /** the inline style the template gives the slider div */
    style?: CSSProperties;
    disabled?: boolean;
    onChange: (value: number | string) => void;
}

interface MetroSliderState {
    /** length of the slider and size of the marker in px, measured like `_initPoints()` */
    length: number;
    marker: number;
    /** the position while and after dragging, until the state changes */
    dragged: number | null;
    /** `sliderActive` of the plugin: the pointer is down */
    active: boolean;
    value: unknown;
}

/** `vis.binds.metro.slider`: min and max as vis-1 read them - the check of max looks at `options.min === null` */
export function sliderRange(options: SliderOptions): { min: number; max: number } {
    let min =
        options.min === undefined || options.min === null || options.min === ''
            ? 0.0
            : parseFloat(options.min as string);
    let max =
        options.max === undefined || options.min === null || options.max === ''
            ? 1.0
            : parseFloat(options.max as string);
    if (max < min) {
        [min, max] = [max, min];
    }
    return { min, max };
}

/** The 0...100 position of the plugin for a state value */
export function sliderPosition(value: unknown, options: SliderOptions): number {
    const { min, max } = sliderRange(options);
    let val: any = value;
    if (val === true || val === 'true') {
        val = max;
    }
    if (val === false || val === 'false') {
        val = min;
    }
    val = parseFloat(val);
    if (isNaN(val)) {
        val = min;
    }
    if (val < min) {
        val = min;
    }
    if (val > max) {
        val = max;
    }
    return Math.floor((val - min) * (100 / (max - min)));
}

export default class MetroSlider extends React.Component<MetroSliderProps, MetroSliderState> {
    private readonly ref = React.createRef<HTMLDivElement>();

    private lastWritten: number | string | null = null;

    private resizeObserver: ResizeObserver | null = null;

    constructor(props: MetroSliderProps) {
        super(props);
        this.state = { length: 0, marker: 12, dragged: null, active: false, value: props.value };
    }

    static getDerivedStateFromProps(
        props: MetroSliderProps,
        state: MetroSliderState,
    ): Partial<MetroSliderState> | null {
        // a new state value moves the marker again - unless it is being dragged
        if (props.value !== state.value) {
            return state.active ? { value: props.value } : { value: props.value, dragged: null };
        }
        return null;
    }

    componentDidMount(): void {
        this.measure();
        // vis-1 rendered the template anew when the widget was resized in the editor, and the plugin measured
        // again; here the slider stays mounted, so it measures whenever its size changes
        if (this.ref.current && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.measure());
            this.resizeObserver.observe(this.ref.current);
        }
    }

    componentWillUnmount(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    componentDidUpdate(prevProps: MetroSliderProps): void {
        if (prevProps.vertical !== this.props.vertical || prevProps.style !== this.props.style) {
            this.measure();
        }
    }

    /** `_initPoints()`: `element.width()` and `marker.width()` - or the heights */
    private measure(): void {
        const element = this.ref.current;
        if (!element) {
            return;
        }
        const marker = element.querySelector<HTMLElement>('.marker');
        const length = this.props.vertical ? element.clientHeight : element.clientWidth;
        const markerSize = marker ? (this.props.vertical ? marker.clientHeight : marker.clientWidth) : 12;
        if (length !== this.state.length || markerSize !== this.state.marker) {
            this.setState({ length, marker: markerSize });
        }
    }

    /** `_percToPix()` */
    private toPixels(position: number): number {
        const ppp = 100 / (this.state.length - this.state.marker);
        return ppp === 0 ? 0 : position / ppp;
    }

    /** `_movingMarker()` + the `change` callback of the binding */
    private move(clientX: number, clientY: number): void {
        const element = this.ref.current;
        if (!element) {
            return;
        }
        const box = element.getBoundingClientRect();
        const { length, marker } = this.state;
        // vis-1 read the whole pixels of the mouse event; a pointer event can have fractions (touch, pen, a
        // scaled display), which can land one step further at the edge of a step - the more exact reading is kept
        let cursor = this.props.vertical ? clientY - box.top : clientX - box.left;
        if (cursor < marker / 2) {
            cursor = marker / 2;
        } else if (cursor > length - marker / 2) {
            cursor = length - marker / 2;
        }
        const pixels = this.props.vertical ? length - cursor - marker / 2 : cursor - marker / 2;
        const position = pixels * (100 / (length - marker));
        this.setState({ dragged: position });

        const { min, max } = sliderRange(this.props.options);
        let value: number | string = Math.round(position) / (100 / (max - min)) + min;
        const step = this.props.options.step as any;
        if (step) {
            value = Math.round(value / step) * step;
        }
        const digits = this.props.options.digits;
        if (digits !== undefined && digits !== null && digits !== '') {
            value = value.toFixed(digits as number);
        }
        // vis-1 wrote on every mouse move; the same value twice in a row is written once
        if (value !== this.lastWritten) {
            this.lastWritten = value;
            this.props.onChange(value);
        }
    }

    private onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.props.disabled) {
            return;
        }
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ active: true });
        this.lastWritten = null;
        this.measure();
        this.move(e.clientX, e.clientY);
    };

    private onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.state.active && e.currentTarget.hasPointerCapture(e.pointerId)) {
            this.move(e.clientX, e.clientY);
        }
    };

    private onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        this.setState({ active: false });
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    render(): React.JSX.Element {
        const { vertical, options } = this.props;
        const position = this.state.dragged ?? sliderPosition(this.props.value, options);
        const measured = this.state.length > 0;

        // before the first measurement the plugin had not placed anything yet: the filled part at its CSS size
        const completeStyle: CSSProperties = {};
        const markerStyle: CSSProperties = {};
        const size = this.toPixels(position) + (vertical ? this.state.marker : 0);
        // jQuery's css() ignores NaN - the dimmer tiles hand in parseFloat(undefined) as min
        if (measured && isFinite(size)) {
            if (vertical) {
                completeStyle.height = size;
                markerStyle.top = this.state.length - size;
            } else {
                completeStyle.width = size;
                markerStyle.left = size;
            }
        }
        if (options.completeColor) {
            completeStyle.backgroundColor = options.completeColor;
        }
        if (options.markerColor) {
            markerStyle.backgroundColor = options.markerColor;
        }

        return (
            <div
                ref={this.ref}
                className={vertical ? 'slider vertical' : 'slider'}
                style={{ ...this.props.style, ...(options.color ? { backgroundColor: options.color } : undefined) }}
                onPointerDown={this.onPointerDown}
                onPointerMove={this.onPointerMove}
                onPointerUp={this.onPointerUp}
                onPointerCancel={this.onPointerUp}
            >
                <div
                    className="complete"
                    style={completeStyle}
                />
                <a
                    className="marker"
                    style={markerStyle}
                />
            </div>
        );
    }
}
