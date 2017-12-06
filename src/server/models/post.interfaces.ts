import { TX } from '../../server/db';
import { RegisterAccount } from './Registers/Account/Register.Account';
import { RegistersAccumulations } from './Registers/Accumulation/factory';

export interface PostResult {
    Account: RegisterAccount[];
    Accumulation: RegistersAccumulations[];
    Info: any[]
}

export interface OnPost {
    OnPost: (Registers: PostResult, tx: TX) => any;
}
