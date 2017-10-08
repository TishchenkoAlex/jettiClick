import { v1 } from 'uuid';

export class DocModel {
    code = '';
    description = '';
    posted = false;
    deleted = false;
    isfolder = false;
    parent: string = null;
    company = '';
    user = '';
    doc: {}

    constructor (
        public type = '',
        public id = v1(),
        public date = new Date().toJSON()) {}
}

export const JETTI_DOC_PROP = Object.keys(new DocModel());
