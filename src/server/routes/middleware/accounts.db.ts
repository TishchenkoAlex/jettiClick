import { ADB as db } from '../../db';
import { IAccount } from '../../models/api';

export namespace Accounts {

  export async function get(id: string): Promise<IAccount> {
    const data = await db.oneOrNone(`SELECT data FROM "accounts" WHERE id = $1`, [id.toLowerCase()]);
    return data ? data.data : null;
  }

  export async function set(account: IAccount): Promise<IAccount> {
    account.email = account.email.toLowerCase();
    let existing = await db.oneOrNone(`SELECT data FROM "accounts" WHERE id = $1`, [account.email]);
    existing = existing ? existing.data : null;
    if (!existing) {
      const data = await db.one(`
        INSERT INTO "accounts" (id, data) VALUES ($1, $2) RETURNING *`, [account.email, account]);
      return (data ? data.data : null) as IAccount;
    } else {
      const data = await db.one(`
        UPDATE "accounts" SET data = $2 WHERE id = $1 RETURNING *`, [account.email, account]);
      return (data ? data.data : null) as IAccount;
    }
  }

  export async function del(id: string): Promise<IAccount> {
    const data = await db.oneOrNone(`DELETE FROM "accounts" WHERE id = $1 RETURNING *`, [id.toLowerCase()]);
    return (data ? data.data : null) as IAccount;
  }

}
