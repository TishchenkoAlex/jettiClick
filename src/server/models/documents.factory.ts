import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { DocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentInvoice } from './Documents/Document.Invoice';
import { IServerDocument } from './../../server/models/ServerDocument';

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

export function createDocument(type: DocTypes, document?: IServerDocument) {
  const doc = RegisteredDocument.find(el => el.type === type);
  if (doc) {
    const result = createInstance(doc.class);
    result.map(document);
    return result;
  }
}


