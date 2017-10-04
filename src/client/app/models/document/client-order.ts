export type ref = string;

export class TablePart {
    id = '';
}

export class DocBase {
    id: string;
    code = '';
    description = '';
    company: ref = '';
    user: ref = '';
    posted = false;
    deleted = false;
    isfolder = false;
    parent: ref = null;
    tableParts: TablePart[] = [];

    get fields() { return Object.keys(this).filter(el => el !== 'tableParts') }
}

export class ClientOrder extends DocBase {
    customer: ref = '';
    amount = 0;
    tax = 0;
    tableParts: [ClientOrderItems, ClientOrderComments];
    constructor () {
        super();
        this.tableParts[0] = new ClientOrderItems();
        this.tableParts[1] = new ClientOrderComments();
    }
}

export class ClientOrderItems extends TablePart {
    sku: ref = '';
    price = 0;
    tax = 0;
    amount = 0;
}

export class ClientOrderComments extends TablePart {
    user: ref = '';
    date: Date = new Date();
    comment = '';
}


export class Users extends DocBase {
    email: string;
}

function createInstance<T extends DocBase>(c: new () => T): T {
    return new c();
}

const a = createInstance(ClientOrder).tableParts[0]
const b = new ClientOrder().tableParts[1]
