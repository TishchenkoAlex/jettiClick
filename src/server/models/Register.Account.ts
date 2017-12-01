import { Ref } from './document';

export interface RegisterAccount {
    debit: { account: Ref, subcounts: any[], qty?: number },
    kredit: { account: Ref, subcounts: any[], qty?: number },
    sum: number,
  }
