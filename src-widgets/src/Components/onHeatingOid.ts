import type { RxWidgetInfoAttributesField, WidgetData } from '@iobroker/types-vis-2';

/** The part of the connection of the editor used here */
interface ObjectSource {
    getObject(id: string): Promise<ioBroker.Object | null | undefined>;
    getObjectViewSystem(
        type: 'state',
        start: string,
        end: string,
    ): Promise<Record<string, ioBroker.Object> | null | undefined>;
}

/**
 * `vis.findByRoles(stateId, roles)` of vis-1: for each role the first state with it, looked for among the states
 * of the channel of `stateId` first and then among those of the whole device.
 */
function findByRoles(
    roles: string[],
    inChannel: ioBroker.Object[],
    inDevice: ioBroker.Object[],
): Record<string, string> {
    const result: Record<string, string> = {};
    const open = [...roles];
    for (const states of [inChannel, inDevice]) {
        for (const obj of states) {
            const index = open.indexOf(obj.common?.role as string);
            if (index !== -1) {
                result[open[index]] = obj._id;
                open.splice(index, 1);
            }
            if (!open.length) {
                return result;
            }
        }
    }
    return result;
}

/**
 * `vis.findByName(stateId, name)` of vis-1: the state `name` next to `stateId`, or else the first state of the
 * device whose id matches `<device>.*.<name>` - without an end anchor, as there.
 */
function findByName(
    stateId: string,
    name: string,
    inChannel: ioBroker.Object[],
    inDevice: ioBroker.Object[],
): string | null {
    const channel = stateId.split('.').slice(0, -1).join('.');
    const beside = inChannel.find(obj => obj._id === `${channel}.${name}`);
    if (beside) {
        return beside._id;
    }
    const device = channel.split('.').slice(0, -1).join('.');
    const reg = new RegExp(`^${device.replace(/\./g, '\\.')}\\..*\\.${name}`);
    return inDevice.find(obj => reg.test(obj._id))?._id ?? null;
}

async function statesUnder(socket: ObjectSource, prefix: string): Promise<ioBroker.Object[]> {
    if (!prefix) {
        return [];
    }
    const states = await socket.getObjectViewSystem('state', `${prefix}.`, `${prefix}.\u9999`);
    return Object.values(states || {}).filter(obj => obj?.common);
}

/**
 * `vis.binds.metro.onHeatingOid` of vis-1, the helper of the editor behind `set_oid`: when a set point
 * (`level.temperature`) is chosen, the attributes still empty are filled from the same device - actual
 * temperature, valve, humidity and battery by role, control mode and window by the names of the Homematic
 * thermostats.
 *
 * vis-1 did this for both heating tiles, so the dialog tile gets the attributes of the wide one as well; they do
 * no harm there.
 */
export async function onHeatingOid(
    _field: RxWidgetInfoAttributesField,
    data: WidgetData,
    changeData: (newData: WidgetData) => void,
    socket: unknown,
): Promise<void> {
    const setOid: string | undefined = data.set_oid;
    if (!setOid) {
        return;
    }
    const source = socket as ObjectSource;
    const obj = await source.getObject(setOid);
    if (obj?.common?.role !== 'level.temperature') {
        return;
    }

    const channel = setOid.split('.').slice(0, -1).join('.');
    const device = channel.split('.').slice(0, -1).join('.');
    const inChannel = await statesUnder(source, channel);
    const inDevice = await statesUnder(source, device);

    let changed = false;
    const roles: Record<string, string> = {
        'value.temperature': 'temp_oid',
        'value.valve': 'drive_oid',
        'value.humidity': 'hum_oid',
        'indicator.battery': 'lowbat_oid',
    };
    const wanted = Object.keys(roles).filter(role => !data[roles[role]]);
    if (wanted.length) {
        const found = findByRoles(wanted, inChannel, inDevice);
        for (const role of Object.keys(found)) {
            data[roles[role]] = found[role];
            changed = true;
        }
    }

    if (!data.controlmode_oid) {
        const found = findByName(setOid, 'CONTROL_MODE', inChannel, inDevice);
        if (found) {
            data.controlmode_oid = found;
            changed = true;
        }
    }
    for (const name of ['WINDOW_STATE', 'WINDOW_OPEN_REPORTING']) {
        if (!data.windowopen_oid) {
            const found = findByName(setOid, name, inChannel, inDevice);
            if (found) {
                data.windowopen_oid = found;
                changed = true;
            }
        }
    }

    if (changed) {
        changeData(data);
    }
}
