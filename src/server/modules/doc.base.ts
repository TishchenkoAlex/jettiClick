export interface DocBase {
    id: string;
    code: string;
    description: string;
    company: string;
    user: string;
    posted: boolean;
    deleted: boolean;
    isfolder: boolean;
    parent: string;
    info: string;
}

export interface FormControlRefValue {
    id: string,
    type: string,
    code: string,
    value: string | number | boolean
}

export type Ref = string;
