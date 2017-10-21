import { DocBase, FileldsAction, Ref } from './doc.base';

export interface CalalogCompany extends DocBase {
    doc: {
        currency: Ref,
        prefix: string
    }
}

