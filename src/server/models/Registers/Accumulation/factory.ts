import { Ref } from '../../document';
import { RegisterAccumulationAR } from './AR';
import { RegisterAccumulationBalance } from './Balance';
import { RegisterAccumulationInventory } from './Inventory';
import { RegisterAccumulation } from './RegisterAccumulation';
import { RegisterAccumulationSales } from './Sales';

export interface IServerRegisterAccumulation {
    kind: boolean,
    date: Date,
    type: string,
    document: Ref,
    company: Ref,
    data: { [x: string]: any }
}

export type RegisterAccumulationTypes =
    'Register.Accumulation.Balance' |
    'Register.Accumulation.AR' |
    'Register.Accumulation.Inventory' |
    'Register.Accumulation.Sales';

export type RegistersAccumulations =
    RegisterAccumulationBalance |
    RegisterAccumulationAR |
    RegisterAccumulationInventory |
    RegisterAccumulationSales;

interface IRegisteredRegisterAccumulation<T extends RegisterAccumulation> {
    type: RegisterAccumulationTypes,
    class: T
}

const RegisteredRegisterAccumulation: IRegisteredRegisterAccumulation<any>[] = [
    { type: 'Register.Accumulation.Balance', class: RegisterAccumulationBalance },
    { type: 'Register.Accumulation.AR', class: RegisterAccumulationAR },
]

function createInstance<T extends RegisterAccumulation>(c: new () => T): T {
    return new c();
}

export function createRegisterAccumulation(type: RegisterAccumulationTypes) {
    const doc = RegisteredRegisterAccumulation.find(el => el.type === type);
    if (doc) { return createInstance(doc.class) }
}

