import * as Queue from 'bull';

import { lib } from '../../std.lib';

export default async function (job: Queue.Job) {
  await job.progress(0);
  const params = job.data;
  const query = `SELECT id FROM "Documents"
    WHERE type = $1 AND company = $2 AND date between $3 AND $4 ORDER BY date, code`;
  const TaskList = [];
  const endDate = new Date(params.EndDate);
  endDate.setHours(23, 59, 59, 999);
  const list = await lib.db.manyOrNone(query, [params.type, params.company, params.StartDate, endDate]);
  const count = list.length; let offset = 0;
  while (offset < count) {
    let i = 0;
    for (i = 0; i < 90; i++) {
      if (!list[i + offset]) { break; }
      const q = lib.doc.postById(list[i + offset].id, true);
      TaskList.push(q);
    }
    offset = offset + i;
    try { await Promise.all(TaskList); } catch (err) { console.log(err); }
    TaskList.length = 0;
    await job.progress(Math.round(offset / count * 100));
  }
  await job.progress(100);
}
