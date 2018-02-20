import { TX } from '../../db';
import { lib } from '../../std.lib';
import { RefValue } from '../api';
import { configSchema } from '../config';
import { Ref } from '../document';
import { RegisterInfoPriceList } from '../Registers/Info/PriceList';
import { ServerDocument } from '../ServerDocument';
import { PostResult } from './../post.interfaces';
import { DocumentInvoice } from './Document.Invoice';
import { DocumentPriceList } from './Document.PriceList';
import { CatalogPriceType } from '../Catalogs/Catalog.PriceType';

export class DocumentPriceListServer extends DocumentPriceList implements ServerDocument {

  async onValueChanged(prop: string, value: any, tx: TX) {
    switch (prop) {
      case 'company':
        return {};
      case 'PriceType':
        const priceType = await lib.doc.viewModelById<CatalogPriceType>(value.id, tx);
        return priceType ? {TaxInclude: priceType.TaxInclude} : {};
      default:
        return {};
    }
  }

  async onCommand(command: string, args: any, tx: TX) {
    switch (command) {
      case 'company':
        return {};
      default:
        return {};
    }
  }

  async baseOn(docId: string, tx: TX): Promise<DocumentPriceList> {
    const ISource = await lib.doc.byId(docId, tx);
    let documentPriceList = await tx.oneOrNone<DocumentPriceList>(`${configSchema.get(this.type).QueryNew}`);
    Object.keys(documentPriceList).forEach(k => this[k] = documentPriceList[k]);
    switch (ISource.type) {
      case 'Document.Invoice':
        const documentInvoice = await lib.doc.viewModelById<DocumentInvoice>(docId);
        const { id, code, date, type, description, user } = documentPriceList;
        documentPriceList = Object.assign(documentPriceList, documentInvoice, { id, code, date, type, description, user } );
        const unitID = await lib.doc.byCode('Catalog.Unit', 'bottle', tx);
        const unitFC = await lib.doc.formControlRef(unitID as string, tx);
        documentPriceList.parent = <RefValue>{id: docId, code: ISource.code, type: ISource.type, value: ISource.description};
        documentPriceList.Items.forEach(el => el.Unit = unitFC as any);
        documentPriceList.TaxInclude = true;
        documentPriceList.posted = false;
        return documentPriceList;
      default:
        return documentPriceList;
    }
  }

  async onPost(tx: TX) {
    const Registers: PostResult = { Account: [], Accumulation: [], Info: [] };

    const priceType = await lib.doc.byId(this.PriceType, tx);
    for (const row of this.Items) {
      Registers.Info.push(new RegisterInfoPriceList({
        currency: priceType.doc.currency,
        PriceType: this.PriceType,
        Product: row.SKU,
        Price: row.Price,
        Unit: row.Unit
      }));
    }
    return Registers;
  }

}
