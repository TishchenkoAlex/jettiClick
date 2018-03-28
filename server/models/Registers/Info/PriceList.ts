import { Ref, Props } from '../../document';
import { JRegisterInfo, RegisterInfo } from './RegisterInfo';

@JRegisterInfo({
  type: 'Register.Info.PriceList',
  description: 'Price list',
})
export class RegisterInfoPriceList extends RegisterInfo {
  @Props({ type: 'Catalog.Currency' })
  currency: Ref = null;

  @Props({ type: 'Catalog.Product' })
  Product: Ref = null;

  @Props({ type: 'Catalog.PriceType' })
  PriceType: Ref = null;

  @Props({ type: 'Catalog.Unit' })
  Unit: Ref = null;

  @Props({ type: 'number' })
  Price = 0;

  constructor(public data: {
    currency: Ref,
    Product: Ref,
    PriceType: Ref,
    Unit: Ref,
    Price: number,
  }) {
    super(data);
  }
}

