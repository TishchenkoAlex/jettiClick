import { Ref } from '../../document';
import { RegisterAccumulationAR } from './AR';
import { RegisterAccumulationBalance } from './Balance';
import { RegisterAccumulationInventory } from './Inventory';
import { RegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationSales } from './Sales';
import { RegisterAccumulationPL } from './PL';
import { RegisterAccumulationAccountablePersons } from './AccountablePersons';
import { RegisterAccumulationAP } from './AP';
import { RegisterAccumulationBank } from './Bank';
import { RegisterAccumulationCash } from './Cash';
import { RegisterAccumulationCashTransit } from './Cash.Transit';
import { RegisterAccumulationLoan } from './Loan';

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

interface IRegisteredRegisterAccumulation { type: RegisterAccumulationTypes; Class: typeof RegisterAccumulation; }
export const RegisteredRegisterAccumulation: IRegisteredRegisterAccumulation[] = [
  { type: 'Register.Accumulation.AccountablePersons', Class: RegisterAccumulationAccountablePersons },
  { type: 'Register.Accumulation.AP', Class: RegisterAccumulationAP },
  { type: 'Register.Accumulation.AR', Class: RegisterAccumulationAR },
  { type: 'Register.Accumulation.Bank', Class: RegisterAccumulationBank },
  { type: 'Register.Accumulation.Balance', Class: RegisterAccumulationBalance },
  { type: 'Register.Accumulation.Cash', Class: RegisterAccumulationCash },
  { type: 'Register.Accumulation.Cash.Transit', Class: RegisterAccumulationCashTransit },
  { type: 'Register.Accumulation.Inventory', Class: RegisterAccumulationInventory },
  { type: 'Register.Accumulation.Loan', Class: RegisterAccumulationLoan },
  { type: 'Register.Accumulation.PL', Class: RegisterAccumulationPL },
  { type: 'Register.Accumulation.Sales', Class: RegisterAccumulationSales },
];

export function createRegisterAccumulation(
  type: RegisterAccumulationTypes, kind: boolean, data: { [x: string]: any }): RegisterAccumulation {
  const doc = RegisteredRegisterAccumulation.find(el => el.type === type);
  if (doc) return new doc.Class(kind, data); else throw new Error(`Can't create type! ${type} is not registered`);
}
