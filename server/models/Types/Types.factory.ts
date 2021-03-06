import { ComplexTypes } from '../documents.types';
import { TypesCatalog } from './Types.Catalog';
import { TypesDocument } from './Types.Document';
import { TypesExpenseOrBalance } from './Types.ExpenseOrBalance';
import { TypesSubcount } from './Types.Subcount';
import { TypesBase } from './TypesBase';

export interface IRegisteredTypes {
  type: ComplexTypes;
  Class: typeof TypesBase;
}

export function createTypes(type: ComplexTypes): TypesBase  {
  const doc = RegisteredTypes.find(el => el.type === type);
  if (doc) return new doc.Class;
  else throw new Error(`type: ${type} is not defined.`);
}

export const RegisteredTypes: IRegisteredTypes[] = [
  { type: 'Types.Document', Class: TypesDocument },
  { type: 'Types.Catalog', Class: TypesCatalog },
  { type: 'Types.Subcount', Class: TypesSubcount },
  { type: 'Types.ExpenseOrBalance', Class: TypesExpenseOrBalance },
];
