import { IAccount } from '../../models/api';
import { sdb, sdba } from '../../mssql';

export namespace Accounts {

  export async function get(id: string): Promise<IAccount> {
    const data = await sdba.oneOrNone<any>(`SELECT JSON_QUERY(data) data FROM "accounts" WHERE id = @p1`, [id.toLowerCase()]);
    return data ? data.data : null;
  }

  export async function set(account: IAccount): Promise<IAccount> {
    account.email = account.email.toLowerCase();
    let existing = await sdba.oneOrNone<{data: any}>(`SELECT JSON_QUERY(data) data FROM "accounts" WHERE id = @p1`, [account.email]);
    existing = existing ? existing.data : null;
    if (!existing) {
      const data = <IAccount>await sdba.none<IAccount>(`
        INSERT INTO "accounts" (id, data) VALUES (@p1, @p2) OUTPUT inserted.* `, [account.email, account]);
      return data;
    } else {
      const data = <IAccount>await sdba.none<IAccount>(`
        UPDATE "accounts" SET data = $2 WHERE id = @p1 OUTPUT updated.*`, [account.email, account]);
      return data;
    }
  }

  export async function del(id: string): Promise<IAccount> {
    const data = <IAccount>await sdba.none<IAccount>(`DELETE FROM "accounts" OUTPUT deleted.* WHERE id = @p1;`, [id.toLowerCase()]);
    return data;
  }

}
