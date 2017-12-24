import { createDocument, IRegisteredDocument } from './../models/documents.factory';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, IServerDocument } from './ServerDocument';

export function createDocumentServer(type: DocTypes, document?: IServerDocument): DocumentBaseServer {
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <DocumentBaseServer> new doc.Class;
    serverResult.map(document);
    return serverResult;
  }
  return createDocument(type) as DocumentBaseServer;
}

const RegisteredServerDocument: IRegisteredDocument[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
]
