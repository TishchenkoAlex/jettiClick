export interface Account {
    account: string,
    description: string
    subcount1: string,
    subcount2: string,
    subcount3: string,
    subcount4: string,
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
