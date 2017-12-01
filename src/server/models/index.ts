import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { JDocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentInvoice } from './Documents/Document.Invoice';

interface IRegisteredDocument<T extends JDocumentBase> {
    type: DocTypes,
    class: T
}

const RegisteredDocument: IRegisteredDocument<any>[] = [
    { type: 'Document.Invoice', class: DocumentInvoice },
    { type: 'Catalog.Currency', class: CatalogCurrency }
]

function createInstance<T extends JDocumentBase>(c: new () => T): T {
    return new c();
}

export function createJDocument(type: DocTypes) {
    const doc = RegisteredDocument.find(el => el.type === type);
    if (doc) { return createInstance(doc.class) }
}
