export type Ref = string;

export interface DocBase {
    id: Ref;
    type: string;
    code: string;
    description: string;
    company: Ref;
    user: Ref;
    posted: boolean;
    deleted: boolean;
    isfolder: boolean;
    parent: Ref;
    info: string;
    doc: { [x: string]: boolean | number | string | Ref | any[] }
}

export interface RefValue {
    id: Ref,
    type: string,
    code: string,
    value: string | number | boolean
}

export interface PatchValue { [x: string]: boolean | number | string | RefValue }

export interface FileldsAction {
    [field: string]: (doc: DocBase, value: any) => Promise<PatchValue>
}

export interface ValueChanges {
    [type: string]: FileldsAction
}
