import { IRegisteredDocument, RegisteredDocument } from './../models/documents.factory';
import { DocTypes } from './documents.types';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentBaseServer, IServerDocument } from './ServerDocument';
import { SQLGenegator } from '../fuctions/SQLGenerator';
import { DocumentOptions } from './document';

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', class: DocumentPriceListServer },
]

export function createDocumentServer(type: DocTypes, document?: IServerDocument) {
  const doc = RegisteredServerDocument.find(el => el.type === type) || RegisteredDocument.find(el => el.type === type);
  if (doc) {
    const createInstance = <T extends DocumentBaseServer>(c: new () => T): T => new c();
    const result = createInstance(doc.class);
    Reflect.defineMetadata('QueryObject', SQLGenegator.QueryObject(result.Props(), result.Prop() as DocumentOptions), result.constructor);
    Reflect.defineMetadata('QueryList', SQLGenegator.QueryList(result.Props(), result.Prop() as DocumentOptions), result.constructor);
    Reflect.defineMetadata('QueryNew', SQLGenegator.QueryNew(result.Props(), result.Prop() as DocumentOptions), result.constructor);
    result.map(document);
    return result;
  }
}
