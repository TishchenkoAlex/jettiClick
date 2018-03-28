import { Props, Ref } from '../../document';
import { JRegisterInfo, RegisterInfo } from './RegisterInfo';

@JRegisterInfo({
  type: 'Register.Info.ExchangeRates',
  description: 'Exchange rates',
})
export class RegisterInfoExchangeRates extends RegisterInfo {
  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'number' })
  Rate = 1;

  constructor(public data: {
    currency: Ref,
    Rate: number,
  }) {
    super(data);
  }
}

