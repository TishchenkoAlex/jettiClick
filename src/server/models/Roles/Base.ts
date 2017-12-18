import { DocTypes } from '../documents.types';
import { AdminObjects } from './Admin';
import { FinanceRoleObject } from './Finance';
import { SalesRoleObjects } from './Sales';

export interface RoleObject { type: DocTypes, read: boolean, write: boolean }

export type RoleType =
  'Finance' |
  'Sales' |
  'Admin'

export interface Role { type: RoleType, Objects: RoleObject[] }

export function getRoleObjects(roles: RoleType[]) {
  const result: RoleObject[] = [];
  roles.forEach(r => result.push(...Roles.find(R => R.type === r).Objects));
  return result;
}

export const Roles: Role[] = [
  { type: 'Admin', Objects: AdminObjects },
  { type: 'Sales', Objects: SalesRoleObjects },
  { type: 'Finance', Objects: FinanceRoleObject },
]
