import { ISubSystem } from './SubSystems';

export const CatalogsSubSystem: ISubSystem = {
  type: 'Catalogs',
  icon: 'fa fa-fw fa-sign-in', description: 'Catalogs', Objects: [
    'Catalog.Product',
    'Catalog.Counterpartie',
    'Catalog.Currency',
    'Catalog.Manager',
    'Catalog.Storehouse'
  ]
};
