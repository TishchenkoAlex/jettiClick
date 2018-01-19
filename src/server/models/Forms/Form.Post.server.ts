import { db, TX } from '../../db';
import { ICallRequest } from '../../routes/utils/interfaces';
import { lib } from '../../std.lib';
import { PatchValue } from '../api';
import { userSocketsEmit } from './../../sockets';
import { FormPost } from './Form.Post';
import { JQueue } from '../Tasks/tasks';

export default class FormPostServer extends FormPost {

  constructor(private CallRequest: ICallRequest) {
    super(CallRequest.formView as FormPost);
  }

  async Execute(tx: TX = db, CR: ICallRequest) {
    const endDate = new Date(this.CallRequest.formView.EndDate);
    endDate.setHours(23, 59, 59, 999);

    const result = (await JQueue.add({
      job: { id: 'post2', description: '(job) post Invoives' },
      user: this.CallRequest.user,
      type: this.CallRequest.formView.type.id,
      company: this.CallRequest.formView.company.id,
      StartDate: this.CallRequest.formView.StartDate,
      EndDate: endDate
    }, { jobId: 'FormPostServer' }));
  }

  async Execute2() {
    userSocketsEmit(this.CallRequest.user, 'Form.Post', 0);
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
      userSocketsEmit(this.CallRequest.user, 'Form.Post', 100);
    } catch (err) {
      console.log(err);
      userSocketsEmit(this.CallRequest.user, 'Form.Post', -1);
    }
  }
}

