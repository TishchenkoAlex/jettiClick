export type CatalogTypes =
  'Catalog.Department' |
  'Catalog.Manager' |
  'Catalog.Storehouse' |
  'Catalog.Currency' |
  'Catalog.Product' |
  'Catalog.PriceType' |
  'Catalog.User' |
  'Catalog.Company' |
  'Catalog.Expense' |
  'Catalog.Income' |
  'Catalog.Balance' |
  'Catalog.Counterpartie' |
  'Catalog.Balance.Analytics';

export type DocumentTypes =
  'Document.Invoice';

export type DocTypes =
  CatalogTypes |
  DocumentTypes;

export type PrimitiveTypes =
  'string' |
  'number' |
  'date' |
  'datetime' |
  'boolean' |
  'table';

export type ComplexTypes =
  'Types.Document' |
  'Types.Subcount' |
  'Types.Catalog';

export type AllTypes =
  PrimitiveTypes |
  ComplexTypes |
  DocTypes;
