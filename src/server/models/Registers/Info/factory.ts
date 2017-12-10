import { Ref } from '../../document';
import { RegisterInfoExchangeRates } from './ExchangeRates';
import { RegisterInfoPriceList } from './PriceList';
import { RegisterInfo } from './RegisterInfo';

export interface IServerRegisterInfo {
    kind: boolean,
    date: Date,
    type: string,
    document: Ref,
    company: Ref,
    data: { [x: string]: any }
}

export type RegisterInfoTypes =
    'Register.Info.PriceList' |
    'Register.Info.ExchangeRates';

export type RegistersInfo =
    RegisterInfoPriceList |
    RegisterInfoExchangeRates;

interface IRegisteredRegisterInfo<T extends RegisterInfo> {
    type: RegisterInfoTypes,
    class: T
}

const RegisteredRegisterInfo: IRegisteredRegisterInfo<any>[] = [
    { type: 'Register.Info.PriceList', class: RegisterInfoPriceList },
    { type: 'Register.Info.ExchangeRates', class: RegisterInfoExchangeRates },
]

function createInstance<T extends RegisterInfo>(c: new () => T): T {
    return new c();
}

export function createRegisterInfo(type: RegisterInfoTypes) {
    const doc = RegisteredRegisterInfo.find(el => el.type === type);
    if (doc) { return createInstance(doc.class) }
}
