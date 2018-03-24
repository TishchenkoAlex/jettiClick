import { RoleObject, Roles, RoleType } from './Base';
import { AllDocTypes, DocTypes } from '../documents.types';

export const FinanceRoleObject: RoleObject[] = [
  { type: 'Catalog.Account', read: true, write: true },
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
  { type: 'Catalog.Operation', read: true, write: true },
  { type: 'Catalog.Operation.Group', read: true, write: true },
  { type: 'Document.Operation', read: true, write: true },
  { type: 'Form.Post', read: true, write: true },
  { type: 'Document.ExchangeRates', read: true, write: true },
];

export interface Permissions { read: boolean; write: boolean; }

export const RoleObjects = new Map<RoleType, Map<AllDocTypes, Permissions>>([
  ['Finance', new Map<AllDocTypes, Permissions>([
    ['Catalog.Account', { read: true, write: true }],
    ['Catalog.Account', { read: true, write: true }],
    ['Catalog.Account', { read: true, write: true }],
  ])],
  ['Finance', new Map<AllDocTypes, Permissions>([
    ['Catalog.Account', { read: true, write: true }]
  ])]
]);
