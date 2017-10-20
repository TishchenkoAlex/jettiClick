import { lib } from '../std.lib';
import { DocCompany } from './Catalog.Company';
import { DocBase, FormControlRefValue, Ref } from './doc.base';

export interface CashIn extends DocBase {
    doc: {
        currency: Ref,
        Amount: number
    }
}

export const company_valueChanges = async (doc: DocBase, value: FormControlRefValue) => {
    const company = await lib.doc.byId(value.id) as DocCompany;
    const currency = await lib.doc.formControlRef(company.doc.currency) as FormControlRefValue;
    return { currency: currency };
}
