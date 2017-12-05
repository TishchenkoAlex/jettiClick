import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { DocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentInvoice } from './Documents/Document.Invoice';

interface IRegisteredDocument<T extends DocumentBase> {
    type: DocTypes,
    class: T
}

const RegisteredDocument: IRegisteredDocument<any>[] = [
    { type: 'Document.Invoice', class: DocumentInvoice },
    { type: 'Catalog.Currency', class: CatalogCurrency }
]

function createInstance<T extends DocumentBase>(c: new () => T): T {
    return new c();
}

export function createDocument(type: DocTypes) {
    const doc = RegisteredDocument.find(el => el.type === type);
    if (doc) { return createInstance(doc.class) }
}
