import { Ref } from '../../document';
import { RegisterAccumulationAR } from './AR';
import { RegisterAccumulationBalance } from './Balance';
import { RegisterAccumulationInventory } from './Inventory';
import { RegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationSales } from './Sales';
import { RegisterAccumulationPL } from './PL';

export type RegisterAccumulationTypes =
  'Register.Accumulation.AccountablePersons' |
  'Register.Accumulation.AP' |
  'Register.Accumulation.AR' |
  'Register.Accumulation.Bank' |
  'Register.Accumulation.Balance' |
  'Register.Accumulation.Cash' |
  'Register.Accumulation.Cash.Transit' |
  'Register.Accumulation.Inventory' |
  'Register.Accumulation.Loan' |
  'Register.Accumulation.PL' |
  'Register.Accumulation.Sales';

interface IRegisteredRegisterAccumulation { type: RegisterAccumulationTypes, Class: typeof RegisterAccumulation }
export const RegisteredRegisterAccumulation: IRegisteredRegisterAccumulation[] = [
  { type: 'Register.Accumulation.Balance', Class: RegisterAccumulationBalance },
  { type: 'Register.Accumulation.AR', Class: RegisterAccumulationAR },
  { type: 'Register.Accumulation.Inventory', Class: RegisterAccumulationInventory },
  { type: 'Register.Accumulation.Sales', Class: RegisterAccumulationSales },
  { type: 'Register.Accumulation.PL', Class: RegisterAccumulationPL },
]

export function createRegisterAccumulation(
  type: RegisterAccumulationTypes, kind: boolean, data: { [x: string]: any }): RegisterAccumulation {
  const doc = RegisteredRegisterAccumulation.find(el => el.type === type);
  if (doc) { return new doc.Class(kind, data) }
}
