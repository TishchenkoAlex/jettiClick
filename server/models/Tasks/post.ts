import * as Queue from 'bull';

import { sdbq } from '../../mssql';
import { lib } from '../../std.lib';

export default async function (job: Queue.Job) {
  await job.progress(0);
  const params = job.data;
  const query = `SELECT id FROM "Documents"
    WHERE type = @p1 AND company = @p2 AND date between @p3 AND @p4 ORDER BY date `;
  const TaskList: any[] = [];
  const endDate = new Date(params.EndDate);
  endDate.setHours(23, 59, 59, 999);
  const list = await sdbq.manyOrNone<any>(query, [params.type, params.company, params.StartDate, endDate.toJSON()]);
  const count = list.length; let offset = 0;
  while (offset < count) {
    let i = 0;
    for (i = 0; i < 99; i++) {
      if (!list[i + offset]) { break; }
      const q = lib.doc.postById(list[i + offset].id, true, sdbq);
      TaskList.push(q);
    }
    offset = offset + i;
    await Promise.all(TaskList);
    TaskList.length = 0;
    await job.progress(Math.round(offset / count * 100));
  }
  await job.progress(100);
}
