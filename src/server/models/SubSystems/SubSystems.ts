import { DocumentOptions } from '../document';
import { createDocument } from './../../models/documents.factory';
import { DocTypes } from './../../models/documents.types';
import { CatalogsSubSystem } from './Catalogs';
import { CommonSubSystem } from './Common';
import { FinanceSubSystem } from './Finance';
import { OperationsSubSystem } from './Operations';
import { SalesSubSystem } from './Sales';
import { FormTypes } from '../Forms/form.types';
import { createForm } from '../Forms/form.factory';
import { FormOptions } from '../Forms/form';

export type SubSystem =
  'Common' |
  'Sales' |
  'Finance' |
  'Catalogs' |
  'Operations';

export interface ISubSystem {
  type: SubSystem,
  icon: string;
  description: string;
  Objects: (DocTypes | FormTypes)[]
}

export const SubSystems: ISubSystem[] = [
  CommonSubSystem,
  CatalogsSubSystem,
  SalesSubSystem,
  FinanceSubSystem,
  OperationsSubSystem,
]

export interface MenuItem { type: string, icon: string, label: string, items?: MenuItem[], routerLink?: string[] };

export function SubSystemsMenu() {
  const menu: MenuItem[] = [];
  for (const s of SubSystems) {
    const menuItem: MenuItem = {type: s.type, icon: s.icon, label: s.description, items: [] };
    for (const o of s.Objects) {
      const doc = createDocument(o as DocTypes) || createForm(o as FormTypes);
      if (doc) {
        const prop = <DocumentOptions | FormOptions>doc.Prop();
        const subMenuItem: MenuItem = {type: prop.type, icon: prop.icon, label: prop.menu, routerLink: ['/' + prop.type] };
        menuItem.items.push(subMenuItem);
      }
    }
    menu.push(menuItem);
  }
  return menu;
}
