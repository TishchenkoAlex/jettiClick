import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Document.Invoice',
  description: 'Invoice',
  dimensions: [
    { Customer: 'Catalog.Counterpartie' },
    { Manager: 'Catalog.Manager' }
  ],
  icon: 'assignment',
  chapter: 'Document',
  generator: 'document_invoice',
  menu: 'Invoices',
  prifix: 'INV'
})
export class DocumentInvoice extends DocumentBase {
  @Props({ type: 'Types.Document', hiddenInList: true })
  parent: Ref = null;

  @Props({ type: 'Catalog.Department', required: true, hiddenInList: true, order: 10 })
  Department: Ref = null;

  @Props({ type: 'Catalog.Storehouse', hiddenInList: true, required: true, order: 11 })
  Storehouse: Ref = null;

  @Props({ type: 'Catalog.Counterpartie', required: true, order: 12, style: {width: '250px'} })
  Customer: Ref = null;

  @Props({ type: 'Catalog.Manager', order: 13 })
  Manager: Ref = null;

  @Props({ type: 'string', required: true, order: 14 })
  Status = 'PREPARED';

  @Props({ type: 'date', hiddenInList: true, order: 15 })
  PayDay = null;

  @Props({ type: 'number', readOnly: true, order: 16 })
  Amount = 0;

  @Props({ type: 'number', readOnly: true, order: 17 })
  Tax = 0;

  @Props({ type: 'Catalog.Currency', required: true, order: 18, style: {width: '100px'} })
  currency: Ref = null;

  @Props({
    type: 'table', required: true, order: 1,
    change: 'let Amount = 0, Tax = 0; value.forEach(el => { Amount += el.Amount; Tax += el.Tax; }); return { Amount: Amount, Tax: Tax }'
  })
  Items: TableItems[] = [new TableItems()];

  @Props({ type: 'table', order: 2 })
  Comments: TableComments[] = [new TableComments()];

}

class TableItems {
  @Props({ type: 'Catalog.Product', required: true, order: 1, style: { width: '400px'} })
  SKU: Ref = null;

  @Props({
    type: 'number', totals: 3, required: true, order: 3,
    change: 'return { Amount: doc.Price * (value || 0), Tax: doc.Price * (value || 0) * 0.18}'
  })
  Qty = 0;

  @Props({ type: 'Catalog.PriceType', required: true, order: 5, style: { width: '120px'} })
  PriceType: Ref = null;

  @Props({
    type: 'number', required: true, order: 4,
    change: 'return { Amount: doc.Qty * (value || 0), Tax: doc.Qty * (value || 0) * 0.18}'
  })
  Price = 0;

  @Props({
    type: 'number', required: true, order: 10,
    change: 'return { Price: value / doc.Qty, Tax: value * 0.18}'
  })
  Amount = 0;

  @Props({ type: 'number', readOnly: true, totals: 9 })
  Tax = 0;
}

class TableComments {
  @Props({ type: 'datetime' })
  Date = new Date();

  @Props({ type: 'Catalog.User' })
  User: Ref = null;

  @Props({ type: 'string' })
  Comment = '';
}
