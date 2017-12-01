import { TX } from '../../server/db';
import { RegisterAccount } from './Register.Account';
import { RegistersAccumulations } from './Register.Accumulation';

export interface PostResult {
    Account: RegisterAccount[];
    Accumulation: RegistersAccumulations[];
    Info: any[]
}

export interface OnPost {
    OnPost: (Registers: PostResult, tx: TX) => any;
}
