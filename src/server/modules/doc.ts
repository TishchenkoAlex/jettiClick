import { v1 } from 'uuid';
import { db } from '../db';
type Ref = string;

interface IDocActions<T> {
  copy: (source: Document<T>) => Document<T>;
  post: () => Document<T>;
}

export class Document<T> {
  doc: T;
  code: string;
  description: string;
  company: Document<Company>;
  user: Document<User>;
  info: string;
  posted = false;
  deleted = false;
  isfolder = false;
  parent: Document<T>;

  copy() {
    const copy = new Document<T>(this.id);
    return copy;
  };

  constructor(public id: Ref) {
    if (!id) { return }
    this.load(id).then(doc => {
      this.id = doc.id;
      this.code = doc.code;
      this.company = new Document<Company>(this.company.id);
    });
  }

  async load(id: Ref) {
    const doc = await db.oneOrNone<Document<T>>('SELECT * FROM "Documents" WHERE id = $1', id);
    return doc;
  }
}

class Currency extends Document<{}> {}
class Company extends Document<{ currency: Currency }> {}

class User extends Document<{ email: string }> {
  aaa() {
    this.doc.email = '';
  }
}

function Do() {
  const a = new Document<Company>(null);
  a.doc.doc.currency = new Document<Currency>(null);
}
