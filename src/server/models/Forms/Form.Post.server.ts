import { db } from '../../db';
import { ICallRequest } from '../../routes/utils/interfaces';
import { lib } from '../../std.lib';
import { PatchValue } from '../api';
import { FormPost } from './Form.Post';
import { userSocketsEmit } from './../../sockets';

export default class FormPostServer extends FormPost {

  constructor(private CallRequest: ICallRequest) {
    super(CallRequest.formView as FormPost);
  }

  async Execute(): Promise<PatchValue> {
    const query = `
      select id, date, code
      from "Documents"
      where
        type = $1 and company = $2
        and date between $3 and $4
      order by date, code`;
    const TaskList = [];
    const endDate = new Date(this.CallRequest.formView.EndDate);
    endDate.setHours(23, 59, 59, 999);
    const list = await db.manyOrNone(query, [
      this.CallRequest.formView.type.id,
      this.CallRequest.formView.company.id,
      this.CallRequest.formView.StartDate,
      endDate,
    ]);
    const count = list.length; let offset = 0;
    while (offset < count) {
      let i = 0;
      for (i = 0; i < 25; i++) {
        if (!list[i + offset]) { userSocketsEmit(this.CallRequest.user, 'Form.Post', 100) };
        const q = lib.doc.postById(list[i + offset].id, true, db);
        TaskList.push(q);
      }
      offset = offset + i;
      try { await Promise.all(TaskList) } catch (err) { console.log(err) }
      userSocketsEmit(this.CallRequest.user, 'Form.Post', offset / count * 100);
      TaskList.length = 0;
    }
    return this.CallRequest.formView;
  }

  async Execute2() {
    const query = `select id, date, code from "Documents"
    where date >= '2017-02-01' and date < '2017-03-01' and type = 'Document.Invoice' and company = 'PHARM'
    order by date, code limit $1`;

    const list = await db.manyOrNone(query, [this.CallRequest.formView.code]);
    for (const row of list) {
      try {
        await lib.doc.postById(row.id, true, db);
      } catch (err) {
        console.log(err);
      }
    }
  }
}


