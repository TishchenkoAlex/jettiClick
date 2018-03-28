import { Ref } from '../../document';
import { RegisterInfoExchangeRates } from './ExchangeRates';
import { RegisterInfoPriceList } from './PriceList';
import { RegisterInfo } from './RegisterInfo';

export type RegisterInfoTypes =
    'Register.Info.PriceList' |
    'Register.Info.ExchangeRates';

export type RegistersInfo =
    RegisterInfoPriceList |
    RegisterInfoExchangeRates;

interface IRegisteredRegisterInfo {
    type: RegisterInfoTypes;
    Class: typeof RegisterInfo;
}

const RegisteredRegisterInfo: IRegisteredRegisterInfo[] = [
    { type: 'Register.Info.PriceList', Class: RegisterInfoPriceList },
    { type: 'Register.Info.ExchangeRates', Class: RegisterInfoExchangeRates },
];

export function createRegisterInfo(type: RegisterInfoTypes, data: { [x: string]: any }) {
    const doc = RegisteredRegisterInfo.find(el => el.type === type);
    if (doc) return new doc.Class(data); else throw new Error(`can't create type! ${type} is not registered`);
}
