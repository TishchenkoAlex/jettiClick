import { createDocument, IRegisteredDocument } from './../models/documents.factory';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, IServerDocument } from './ServerDocument';
import { CatalogAccount } from './Catalogs/Catalog.Account';
import { DocumentBase } from './document';

export function createDocumentServer<T extends DocumentBaseServer | DocumentBase>(type: DocTypes, document?: IServerDocument): T {
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    serverResult.map(document);
    return serverResult;
  }
  return createDocument<T>(type);
}

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
]

// const catalogAccount = createDocumentServer<CatalogAccount>('Catalog.Account');
