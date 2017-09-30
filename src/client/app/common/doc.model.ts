import { v1 } from 'uuid';

export class DocModel {
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

    constructor (public type: string, public id: string) {
        if (!this.id) { this.id = v1() }
    }
}

export const JETTI_DOC_PROP = Object.keys(new DocModel('', ''));
