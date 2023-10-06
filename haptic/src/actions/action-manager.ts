import {Binding, ElementsPerValue, ValueType} from '../input-source/binding.js';
import {InputSource} from '../input-source/input.js';
import {KeyboardInputSource} from '../input-source/keyboard-input-source.js';
import {TypedArray} from '../types.js';
import {Action, Axis2dAction, BooleanAction} from './actions.js';

class Values<T extends TypedArray> {
    buffer: T;
    eltCount: number;
    count = 0;

    constructor(buffer: T, eltCount = 1) {
        this.buffer = buffer;
        this.eltCount = eltCount;
    }

    add() {
        const id = this.count;
        ++this.count;
        return this.buffer.length / this.eltCount;
    }

    grow(count: number) {
        const requiredSize = count * this.eltCount;
        if (requiredSize <= this.buffer.length) return;

        const size = count * this.eltCount * 0.2;
        const newBuffer = new (this.buffer.constructor as any)(size) as T;
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
    }
}

export class ActionManager {
    _sourceToIndex: Map<InputSource, number> = new Map();
    _sources: InputSource[];

    _types: ValueType[] = [];
    _booleans = new Values(new Uint8Array(), ElementsPerValue[ValueType.Boolean]);
    _axis2d = new Values(new Float32Array(), ElementsPerValue[ValueType.Axis2d]);

    constructor(sources: InputSource[]) {
        this._sources = new Array(sources.length).fill(null);
        for (let i = 0; i < sources.length; ++i) {
            this._sources[i] = sources[i];
            this._sourceToIndex.set(sources[i], i);
        }
    }

    add(name: string, type: ValueType, bindings: Binding[]): Action {
        for (const binding of bindings) {
            if (binding.type !== type) {
                /** @todo: Better error message. */
                throw new Error('unsupported');
            }
        }

        let action = null;
        switch (type) {
            case ValueType.Boolean:
                action = new BooleanAction(this._booleans.add(), name);
                break;
            case ValueType.Axis2d:
                action = new Axis2dAction(this._axis2d.add(), name);
                break;
            default:
                /** @todo: Better error message. */
                throw new Error('unsupported');
        }

        return action;
    }

    update(dt: number) {}
}

const keyboard = new KeyboardInputSource();

const manager = new ActionManager([keyboard]);
// const fire = manager.add(BooleanAction, new KeyboardMapping('enter'));
