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

export function buildTypesQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      '${row.type}' "type",
      '${row.type}' code,
      '${row.description}' description,
      TRUE posted,
      FALSE deleted,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE TRUE `;
  return query;
}

export function buildSubcountQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      'Catalog.Subcount' "type",
      '${row.type}' code,
      '${row.description}' description,
      TRUE posted,
      FALSE deleted,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE TRUE `;
  return query;
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
