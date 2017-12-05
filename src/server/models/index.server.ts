import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { DocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentBaseServer, IServerDocument } from './ServerDocument';

interface IRegisteredDocument<T extends DocumentBase> {
  type: DocTypes,
  class: T
}

const RegisteredDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', class: DocumentInvoiceServer },
  { type: 'Catalog.Currency', class: CatalogCurrency }
]

function createInstance<T extends DocumentBaseServer>(c: new () => T): T {
  return new c();
}

export function createServerDocument(type: DocTypes, document?: IServerDocument) {
  const doc = RegisteredDocument.find(el => el.type === type);
  if (doc) {
    const result = createInstance(doc.class);
    result.map(document);
    return result;
  }
}
