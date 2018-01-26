import { RoleObject } from './Base';

export const CatalogsRoleObject: RoleObject[] = [
  { type: 'Catalog.Product', read: true, write: true },
  { type: 'Catalog.Counterpartie', read: true, write: true },
  { type: 'Catalog.Currency', read: true, write: true },
  { type: 'Catalog.Manager', read: true, write: true },
  { type: 'Catalog.Storehouse', read: true, write: true },
  { type: 'Catalog.Department', read: true, write: true },
  { type: 'Catalog.User', read: true, write: true },
  { type: 'Catalog.Company', read: true, write: true },
  { type: 'Catalog.Currency', read: true, write: true },
];
