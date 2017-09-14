import { v1 } from 'uuid';

export class DocModel {
    id = '';
    date = new Date().toJSON();
    code = '';
    description = '';
    posted = false;
    deleted = false;
    isfolder = false;
    parent: string = null;
    company = '';
    user = '';
    doc: {}

    constructor (public type: string) {
        this.id = v1();
    }
}

export const JETTI_DOC_PROP = Object.keys(new DocModel(''));