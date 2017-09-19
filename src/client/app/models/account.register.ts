export interface SubCount {
    id: string,
    code: string
    type: string,
    value: string
}

export interface Account {
    account: string,
    description: string
    subcount1: SubCount,
    subcount2: SubCount,
    subcount3: SubCount,
    subcount4: SubCount,
    currency: string,
    qty: number,
}

export interface AccountRegister {
    document_id: string;
    date: string;
    document: string;
    debet: Account;
    kredit: Account;
    sum: number;
    company: string;
}
