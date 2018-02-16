import * as Queue from 'bull';

import { lib } from '../../std.lib';

export default async function (job: Queue.Job) {
  job.progress(0);
  const params = job.data;
  const query = `SELECT id FROM "Documents"
    WHERE type = @p1 AND company = @p2 AND date between @p3 AND @p4 ORDER BY date`;
  const TaskList = [];
  const endDate = new Date(params.EndDate);
  endDate.setHours(23, 59, 59, 999);
  try {
    const list = await lib.db.manyOrNone<any>(query, [params.type, params.company, params.StartDate, endDate.toJSON()]);
    const count = list.length; let offset = 0;
    while (offset < count) {
      let i = 0;
      for (i = 0; i < 49; i++) {
        if (!list[i + offset]) { break; }
        const q = lib.doc.postById(list[i + offset].id, true);
        TaskList.push(q);
      }
      offset = offset + i;
      try { await Promise.all(TaskList); } catch (err) { console.log(err); }
      TaskList.length = 0;
      job.progress(Math.round(offset / count * 100));
    }
    job.progress(100);
  } catch (err) {
    console.log(err);
    await job.progress(100);
    throw new Error(err);
  }
}
