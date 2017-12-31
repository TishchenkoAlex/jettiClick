import { db } from '../../db';
import { Events } from '../../routes/events';
import { ICallRequest } from '../../routes/utils/interfaces';
import { lib } from '../../std.lib';
import { PatchValue } from '../api';
import { userSocketsEmit } from './../../sockets';
import { FormPost } from './Form.Post';

export default class FormPostServer extends FormPost {

  constructor(private CallRequest: ICallRequest) {
    super(CallRequest.formView as FormPost);
  }

  async Execute(): Promise<PatchValue> {
    const event = await Events.create('post Invoices', this.CallRequest.user, '');
    try {
      const query = `
      SELECT id, date, code FROM "Documents"
      WHERE type = $1 AND company = $2 AND date between $3 AND $4
      ORDER BY date, code`;
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
          const q = lib.doc.postById(list[i + offset].id, true, db);
          TaskList.push(q);
        }
        offset = offset + i;
        try { await Promise.all(TaskList) } catch (err) { console.log(err) }
        userSocketsEmit(this.CallRequest.userID, 'Form.Post', offset / count * 100);
        await Events.updateProgress(event.id, Math.round(offset / count * 100));
        TaskList.length = 0;
      }
      await Events.updateProgress(event.id, 100, new Date());
      return this.CallRequest.formView;
    } catch (err) {
      await Events.updateProgress(event.id, 100, new Date(), err);
    }
  }

  async Execute2() {
    const event = await Events.create('post Invoices', this.CallRequest.user);
    try {
      const query = `
      SELECT id, date, code FROM "Documents"
      WHERE type = $1 AND company = $2 AND date between $3 AND $4
      ORDER BY date, code`;
      const endDate = new Date(this.CallRequest.formView.EndDate);
      endDate.setHours(23, 59, 59, 999);
      const list = await db.manyOrNone(query, [
        this.CallRequest.formView.type.id,
        this.CallRequest.formView.company.id,
        this.CallRequest.formView.StartDate,
        endDate
      ]);

      let count = 0;
      for (const row of list) {
        userSocketsEmit(this.CallRequest.userID, 'Form.Post', ++count / list.length * 100);
        try {
          await lib.doc.postById(row.id, true, db);
        } catch (err) {
          console.log(err);
        }
      }
      await Events.updateProgress(event.id, 100, new Date());
    } catch (err) {
      await Events.updateProgress(event.id, 100, new Date(), err);
    }
  }
}


