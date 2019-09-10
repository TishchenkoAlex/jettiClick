import { IFlatDocument } from '../models/ServerDocument';
import { CatalogAccount } from './Catalogs/Catalog.Account';
import { CatalogBalance } from './Catalogs/Catalog.Balance';
import { CatalogBalanceAnalytics } from './Catalogs/Catalog.Balance.Analytics';
import { CatalogBankAccount } from './Catalogs/Catalog.BankAccount';
import { CatalogBrand } from './Catalogs/Catalog.Brand';
import { CatalogCashFlow } from './Catalogs/Catalog.CashFlow';
import { CatalogCashRegister } from './Catalogs/Catalog.CashRegister';
import { CatalogCompany } from './Catalogs/Catalog.Company';
import { CatalogCounterpartie } from './Catalogs/Catalog.Counterpartie';
import { CatalogCurrency } from './Catalogs/Catalog.Currency';
import { CatalogDepartment } from './Catalogs/Catalog.Department';
import { CatalogDocuments } from './Catalogs/Catalog.Documents';
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
import { CatalogProductCategory } from './Catalogs/Catalog.ProductCategory';
import { CatalogProductKind } from './Catalogs/Catalog.ProductKind';
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
import { DocumentSettings } from './Documents/Document.Settings';

export interface IRegisteredDocument<T extends DocumentBase> { type: DocTypes; Class: T; }

export function createDocument<T extends DocumentBase>(type: DocTypes, document?: IFlatDocument): T {
  const doc = RegisteredDocument.find(el => el.type === type);
  if (doc) {
    const result = <T>new doc.Class;
    const ArrayProps = Object.keys(result).filter(k => Array.isArray(result[k]));
    ArrayProps.forEach(prop => result[prop].length = 0);
    if (document) result.map(document);
    return result;
  } else throw new Error(`createDocument: can't create '${type}' type! '${type}' is not registered`);
}

export const RegisteredDocument: IRegisteredDocument<any>[] = [
  { type: 'Catalog.Account', Class: CatalogAccount },
  { type: 'Catalog.Balance', Class: CatalogBalance },
  { type: 'Catalog.Balance.Analytics', Class: CatalogBalanceAnalytics },
  { type: 'Catalog.BankAccount', Class: CatalogBankAccount },
  { type: 'Catalog.CashFlow', Class: CatalogCashFlow },
  { type: 'Catalog.CashRegister', Class: CatalogCashRegister },
  { type: 'Catalog.Currency', Class: CatalogCurrency },
  { type: 'Catalog.Company', Class: CatalogCompany },
  { type: 'Catalog.Counterpartie', Class: CatalogCounterpartie },
  { type: 'Catalog.Department', Class: CatalogDepartment },
  { type: 'Catalog.Expense', Class: CatalogExpense },
  { type: 'Catalog.Expense.Analytics', Class: CatalogExpenseAnalytics },
  { type: 'Catalog.Income', Class: CatalogIncome },
  { type: 'Catalog.Loan', Class: CatalogLoan },
  { type: 'Catalog.Manager', Class: CatalogManager },
  { type: 'Catalog.Person', Class: CatalogPerson },
  { type: 'Catalog.PriceType', Class: CatalogPriceType },
  { type: 'Catalog.Product', Class: CatalogProduct },
  { type: 'Catalog.ProductCategory', Class: CatalogProductCategory },
  { type: 'Catalog.ProductKind', Class: CatalogProductKind },
  { type: 'Catalog.Storehouse', Class: CatalogStorehouse },
  { type: 'Catalog.Operation', Class: CatalogOperation },
  { type: 'Catalog.Operation.Group', Class: CatalogOperationGroup },
  { type: 'Catalog.Unit', Class: CatalogUnit },
  { type: 'Catalog.User', Class: CatalogUser },
  { type: 'Catalog.Documents', Class: CatalogDocuments },
  { type: 'Catalog.Subcount', Class: CatalogSubcount },
  { type: 'Catalog.Brand', Class: CatalogBrand },

  { type: 'Document.ExchangeRates', Class: DocumentExchangeRates },
  { type: 'Document.Settings', Class: DocumentSettings },
  { type: 'Document.Invoice', Class: DocumentInvoice },
  { type: 'Document.Operation', Class: DocumentOperation },
  { type: 'Document.PriceList', Class: DocumentPriceList },
];
