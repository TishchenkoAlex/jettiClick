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
  Rate: number = null;

  constructor(public data: {
    currency: Ref,
    Rate: number,
  }) {
    super();
    if (data) {
      this.currency = data.currency;
      this.Rate = data.Rate;
    }
  }
}

