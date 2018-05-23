export type CatalogTypes =
  'Catalog.Account' |
  'Catalog.Balance' |
  'Catalog.Balance.Analytics' |
  'Catalog.BankAccount' |
  'Catalog.CashFlow' |
  'Catalog.CashRegister' |
  'Catalog.Company' |
  'Catalog.Counterpartie' |
  'Catalog.Currency' |
  'Catalog.Department' |
  'Catalog.Expense' |
  'Catalog.Expense.Analytics' |
  'Catalog.Income' |
  'Catalog.Loan' |
  'Catalog.Operation' |
  'Catalog.Operation.Group' |
  'Catalog.Manager' |
  'Catalog.Person' |
  'Catalog.PriceType' |
  'Catalog.Product' |
  'Catalog.Storehouse' |
  'Catalog.Subcount' |
  'Catalog.Documents' |
  'Catalog.User' |
  'Catalog.Unit' |
  'Catalog.Brand'
 ;

export type DocumentTypes =
  'Document.CashIn' |
  'Document.ExchangeRates' |
  'Document.Settings' |
  'Document.Invoice' |
  'Document.Operation' |
  'Document.PriceList';

export type DocTypes =
  CatalogTypes |
  DocumentTypes;

export type AllDocTypes =
  DocTypes |
  ComplexTypes;

export type PrimitiveTypes =
  'string' |
  'number' |
  'date' |
  'datetime' |
  'time' |
  'boolean' |
  'table' |
  'json' |
  'javascript'|
  'textarea';

export type ComplexTypes =
  'Types.Document' |
  'Types.Subcount' |
  'Types.Catalog';

export type IncomeExpenseTypes =
'Catalog.Expense' |
'Catalog.Income';

export type IncomeExpenseAnalyticTypes =
'Catalog.Expense.Analytics' |
'Catalog.Income.Analytics';

export type AllTypes =
  PrimitiveTypes |
  ComplexTypes |
  DocTypes;
