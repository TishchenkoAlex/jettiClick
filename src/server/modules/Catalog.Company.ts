import { IDocBase, FileldsAction, Ref } from './doc.base';

export interface CalalogCompany extends IDocBase {
    doc: {
        currency: Ref,
        prefix: string
    }
}

