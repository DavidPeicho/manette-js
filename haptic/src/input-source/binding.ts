export enum ValueType {
    Boolean = 0,
    Float = 1,
    Axis2d = 2,
}

export const ElementsPerValue: [number, number, number] = [1, 1, 2];

export interface Binding {
    type: ValueType;
}

export class BooleanBinding implements Binding {
    type = ValueType.Boolean;
    buttons: number;

    constructor(buttons: number) {
        this.buttons = buttons;
    }
}

export class Axis2dCompositeBinding implements Binding {
    type = ValueType.Axis2d;
    buttons: number;

    constructor(buttons: number) {
        this.buttons = buttons;
    }
}
