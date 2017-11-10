export type Ref = string;

export interface IDocBase {
    id: Ref;
    date: string,
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

import { v1 } from 'uuid';

export class DocModel implements IDocBase  {
    public code = '';
    public description = '';
    public company: Ref = null;
    public user: Ref = null;
    public posted  = false;
    public deleted = false;
    public parent: Ref = null;
    public info = '';
    public doc: { [x: string]: boolean | number | string | Ref | any[] } = {};

    constructor (
        public type = '',
        public id = v1(),
        public date = new Date().toJSON(),
        public isfolder = false
    ) {}
}

export const JETTI_DOC_PROP = Object.keys(new DocModel());

export interface PatchValue { [x: string]: boolean | number | string | RefValue }

export interface FileldsAction {
    [field: string]: (doc: IDocBase, value: RefValue) => Promise<PatchValue>
}

export interface ValueChanges {
    [type: string]: FileldsAction
}

