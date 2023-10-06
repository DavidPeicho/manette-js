export class Action {
    private readonly _id: number;
    private readonly _name: string;

    constructor(id: number, name: string) {
        this._id = id;
        this._name = name;
    }

    get id() {
        return this._id;
    }
}

/* Can have a state */
export class BooleanAction extends Action {}

/* Doesn't have a state */
export class Axis2dAction extends Action {}
