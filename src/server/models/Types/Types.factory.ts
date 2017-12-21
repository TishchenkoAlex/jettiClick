import { ComplexTypes } from '../documents.types';
import { TypesCatalog } from './Types.Catalog';
import { TypesDocument } from './Types.Document';
import { TypesSubcount } from './Types.Subcount';

export type TypesType =
  TypesDocument |
  TypesCatalog |
  TypesSubcount;

export interface IRegisteredTypes<T> {
  type: ComplexTypes,
  class: T
}

export function createTypes(type: ComplexTypes) {
  const doc = RegisteredTypes.find(el => el.type === type);
  if (doc) {
    const createInstance = <T>(c: new () => T): T => new c();
    return createInstance<TypesType>(doc.class as any)
  }
}

export const RegisteredTypes: IRegisteredTypes<any>[] = [
  { type: 'Types.Document', class: TypesDocument },
  { type: 'Types.Catalog', class: TypesCatalog },
  { type: 'Types.Subcount', class: TypesSubcount },
]
