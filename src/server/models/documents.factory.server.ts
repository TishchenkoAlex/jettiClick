import { createDocument, IRegisteredDocument } from './../models/documents.factory';
import { CatalogOperationServer } from './Catalogs/Catalog.Operation.server';
import { DocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, INoSqlDocument } from './ServerDocument';

export function createDocumentServer<T extends DocumentBaseServer | DocumentBase>(type: DocTypes, document?: INoSqlDocument): T {
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    serverResult.map(document);
    return serverResult;
  }
  return createDocument<T>(type, document);
}

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
  { type: 'Catalog.Operation', Class: CatalogOperationServer },
];

// const catalogAccount = createDocumentServer<CatalogAccount>('Catalog.Account');
