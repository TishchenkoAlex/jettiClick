import { IServerDocument } from './../../server/models/ServerDocument';
import { CatalogAccount } from './Catalogs/Catalog.Account';
import { CatalogBalance } from './Catalogs/Catalog.Balance';
import { CatalogBalanceAnalytics } from './Catalogs/Catalog.Balance.Analytics';
import { CatalogBankAccount } from './Catalogs/Catalog.BankAccount';
import { CatalogCashFlow } from './Catalogs/Catalog.CashFlow';
import { CatalogCashRegister } from './Catalogs/Catalog.CashRegister';
import { CatalogCompany } from './Catalogs/Catalog.Company';
import { CatalogCounterpartie } from './Catalogs/Catalog.Counterpartie';
import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { CatalogDepartment } from './Catalogs/Catalog.Department';
import { CatalogExpense } from './Catalogs/Catalog.Expense';
import { CatalogExpenseAnalytics } from './Catalogs/Catalog.Expense.Analytics';
import { CatalogIncome } from './Catalogs/Catalog.Income';
import { CatalogLoan } from './Catalogs/Catalog.Loan';
import { CatalogManager } from './Catalogs/Catalog.Manager';
import { CatalogOperation } from './Catalogs/Catalog.Operation';
import { CatalogOperationGroup } from './Catalogs/Catalog.Operation.Group';
import { CatalogPerson } from './Catalogs/Catalog.Person';
import { CatalogPriceType } from './Catalogs/Catalog.PriceType';
import { CatalogProduct } from './Catalogs/Catalog.Product';
import { CatalogStorehouse } from './Catalogs/Catalog.Storehouse';
import { CatalogSubcount } from './Catalogs/Catalog.Subcount';
import { CatalogUnit } from './Catalogs/Catalog.Unit';
import { CatalogUser } from './Catalogs/Catalog.User';
import { DocumentBase } from './document';
import { DocTypes } from './documents.types';
import { DocumentExchangeRates } from './Documents/Document.ExchangeRates';
import { DocumentInvoice } from './Documents/Document.Invoice';
import { DocumentOperation } from './Documents/Document.Operation';
import { DocumentPriceList } from './Documents/Document.PriceList';

export interface IRegisteredDocument<T extends DocumentBase> {
  type: DocTypes,
  class: T
}

export function createDocument(type: DocTypes, document?: IServerDocument) {
  const doc = RegisteredDocument.find(el => el.type === type);
  if (doc) {
    const createInstance = <T extends DocumentBase>(c: new () => T): T => new c();
    const result = createInstance(doc.class);
    result.map(document);
    return result;
  }
}

export const RegisteredDocument: IRegisteredDocument<any>[] = [
  { type: 'Catalog.Account', class: CatalogAccount },
  { type: 'Catalog.Balance', class: CatalogBalance },
  { type: 'Catalog.Balance.Analytics', class: CatalogBalanceAnalytics },
  { type: 'Catalog.BankAccount', class: CatalogBankAccount },
  { type: 'Catalog.CashFlow', class: CatalogCashFlow },
  { type: 'Catalog.CashRegister', class: CatalogCashRegister },
  { type: 'Catalog.Currency', class: CatalogCurrency },
  { type: 'Catalog.Company', class: CatalogCompany },
  { type: 'Catalog.Counterpartie', class: CatalogCounterpartie },
  { type: 'Catalog.Department', class: CatalogDepartment },
  { type: 'Catalog.Expense', class: CatalogExpense },
  { type: 'Catalog.Expense.Analytics', class: CatalogExpenseAnalytics },
  { type: 'Catalog.Income', class: CatalogIncome },
  { type: 'Catalog.Loan', class: CatalogLoan },
  { type: 'Catalog.Manager', class: CatalogManager },
  { type: 'Catalog.Person', class: CatalogPerson },
  { type: 'Catalog.PriceType', class: CatalogPriceType },
  { type: 'Catalog.Product', class: CatalogProduct },
  { type: 'Catalog.Storehouse', class: CatalogStorehouse },
  { type: 'Catalog.Operation', class: CatalogOperation },
  { type: 'Catalog.Operation.Group', class: CatalogOperationGroup },
  { type: 'Catalog.Subcount', class: CatalogSubcount },
  { type: 'Catalog.User', class: CatalogUser },
  { type: 'Catalog.Unit', class: CatalogUnit },

  { type: 'Document.ExchangeRates', class: DocumentExchangeRates },
  { type: 'Document.Invoice', class: DocumentInvoice },
  { type: 'Document.Operation', class: DocumentOperation },
  { type: 'Document.PriceList', class: DocumentPriceList },
]


