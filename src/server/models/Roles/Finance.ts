import { RoleObject } from './Base';

export const FinanceRoleObject: RoleObject[] = [
    { type: 'Catalog.Balance', read: true, write: true },
    { type: 'Catalog.Balance.Analytics', read: true, write: true },
    { type: 'Catalog.BankAccount', read: true, write: true },
    { type: 'Catalog.Expense', read: true, write: true },
    { type: 'Catalog.Expense.Analytics', read: true, write: true },
    { type: 'Catalog.Income', read: true, write: true },
    { type: 'Catalog.CashFlow', read: true, write: true },
    { type: 'Catalog.CashRegister', read: true, write: true },
    { type: 'Catalog.Loan', read: true, write: true },
    { type: 'Document.Invoice', read: true, write: true },
    { type: 'Document.CashIn', read: true, write: true },
    { type: 'Document.ExchangeRates', read: true, write: true },
    { type: 'Form.Post', read: true, write: true}
  ]

