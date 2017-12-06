import { Ref } from './../../document';

export interface RegisterAccount {
  debit: { account: Ref, subcounts: any[], qty?: number, currency?: Ref },
  kredit: { account: Ref, subcounts: any[], qty?: number, currency?: Ref },
  operation?: Ref,
  company?: Ref,
  sum: number,
}
