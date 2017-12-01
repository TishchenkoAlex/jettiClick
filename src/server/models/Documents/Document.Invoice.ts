import { JDocument, JDocumentBase, Props, Ref } from './../document';

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
export class DocumentInvoice extends JDocumentBase {
  @Props({ type: 'Types.Document', 'hiddenInList': true })
  parent: Ref = null;

  @Props({ type: 'Catalog.Department' })
  Department: Ref = null;

  @Props({ type: 'Catalog.Manager' })
  Manager: Ref = null;

  @Props({ type: 'Catalog.Customer' })
  Customer: Ref = null;

  @Props({ type: 'Catalog.Storehouse' })
  Storehouse: Ref = null;

  @Props({ type: 'string' })
  Status: 'PREPARED';

  @Props({ type: 'date' })
  PayDay = '';

  @Props({ type: 'number' })
  Amount = 0;

  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'number' })
  Tax = 0;

  @Props({ type: 'table', required: true })
  Items: TableItems[] = [];

  @Props({ type: 'table' })
  Comments: TableComments[] = [];

  Props() {
    this.Items.push(new TableItems());
    this.Comments.push(new TableComments());
    const result = super.Props();
    this.Items.pop();
    this.Comments.pop();
    return result;
  }
}

class TableItems {
  @Props({ type: 'Catalog.Product' })
  SKU: Ref = null;

  @Props({ type: 'number' })
  Qty = 0;

  @Props({ type: 'Catalog.PriceType' })
  PriceType: Ref = null;

  @Props({ type: 'Catalog.Product' })
  Price: 0

  @Props({ type: 'number' })
  Amount = 0;

  @Props({ type: 'number' })
  Tax = 0;
}

class TableComments {
  @Props({ type: 'datetime' })
  Date = new Date();

  @Props({ type: 'Catalog.User' })
  User: Ref = null;

  Comment = '';
}
