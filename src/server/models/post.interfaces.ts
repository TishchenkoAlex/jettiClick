import { TX } from '../../server/db';
import { RegisterAccount } from './Registers/Account/Register.Account';
import { RegisterAccumulation} from './Registers/Accumulation/RegisterAccumulation';

export interface PostResult {
    Account: RegisterAccount[];
    Accumulation: RegisterAccumulation[];
    Info: any[]
}

export interface OnPost {
    OnPost: (Registers: PostResult, tx: TX) => any;
}
