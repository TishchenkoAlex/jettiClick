import { v1 } from 'uuid';

export class DocModel {
    id = '';
    date = new Date();
    code = '';
    description = ''
    posted = false;
    deleted = false;
    isfolder = false;
    parent: string = null;
    doc: {}

    constructor (public type: string) {
        this.date = new Date();
        this.id = v1();
    }
}
