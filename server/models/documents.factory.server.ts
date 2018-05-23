import { sdb } from '../mssql';
import { lib } from '../std.lib';
import { IRegisteredDocument, createDocument } from './../models/documents.factory';
import { CatalogOperation } from './Catalogs/Catalog.Operation';
import { CatalogOperationServer } from './Catalogs/Catalog.Operation.server';
import { DocumentExchangeRatesServer } from './Documents/Document.ExchangeRates.server';
import { DocumentInvoiceServer } from './Documents/Document.Invoce.server';
import { DocumentOperation } from './Documents/Document.Operation';
import { DocumentOperationServer } from './Documents/Document.Operation.server';
import { DocumentPriceListServer } from './Documents/Document.PriceList.server';
import { DocumentSettingsServer } from './Documents/Document.Settings.server';
import { DocumentBaseServer, IFlatDocument } from './ServerDocument';
import { RefValue, calculateDescription } from './api';
import { DocumentBase, DocumentOptions } from './document';
import { DocTypes } from './documents.types';

const RegisteredServerDocument: IRegisteredDocument<any>[] = [
  { type: 'Document.Invoice', Class: DocumentInvoiceServer },
  { type: 'Document.ExchangeRates', Class: DocumentExchangeRatesServer },
  { type: 'Document.PriceList', Class: DocumentPriceListServer },
  { type: 'Document.Operation', Class: DocumentOperationServer },
  { type: 'Document.Settings', Class: DocumentSettingsServer },
  { type: 'Catalog.Operation', Class: CatalogOperationServer },
];

export async function createDocumentServer<T extends DocumentBaseServer | DocumentBase>
  (type: DocTypes, document?: IFlatDocument, tx = sdb) {
  let result: T;
  const doc = RegisteredServerDocument.find(el => el.type === type);
  if (doc) {
    const serverResult = <T>new doc.Class;
    const ArrayProps = Object.keys(serverResult).filter(k => Array.isArray(serverResult[k]));
    ArrayProps.forEach(prop => serverResult[prop].length = 0);
    if (document) serverResult.map(document);
    result = serverResult;
  } else {
    result = createDocument<T>(type, document);
  }
  const Props = Object.assign({}, result.Props());
  let Operation: CatalogOperation | null = null;
  let Grop: RefValue | null = null;
  if (result instanceof DocumentOperation && document && document.id) {
    result.f1 = null; result.f2 = null; result.f3 = null;
    if (result.Operation) {
      Operation = await lib.doc.byIdT<CatalogOperation>(result.Operation as string);
      Grop = await lib.doc.formControlRef(Operation!.Group as string);
      result.Group = Operation!.Group;
      let i = 1;
      (Operation && Operation.Parameters || []).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(c => {
        if (c.type!.startsWith('Catalog.')) result[`f${i++}`] = result[c.parameter];
        Props[c.parameter] = ({
          label: c.label, type: c.type, required: !!c.required, change: c.change, order: (c.order || 0) + 103,
          [c.parameter]: c.tableDef ? JSON.parse(c.tableDef) : null, ...JSON.parse(c.Props ? c.Props : '{}')
        });
      });
      if (Operation && Operation.module) {
        const func = new Function('', Operation.module);
        result['module'] = func.bind(result)();
      }
    }
  }
  // protect against mutate
  result.Props = () => Props;

  if (result.isDoc) result.description =
    calculateDescription((result.Prop() as DocumentOptions).description, result.date, result.code, Grop && Grop.value as string || '');
  return result;
}
