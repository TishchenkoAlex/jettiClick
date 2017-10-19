import { DocBase, Ref } from './doc.base';

export interface DocCompany extends DocBase {
    doc: {
        currency: Ref,
        prefix: string
    }
}
