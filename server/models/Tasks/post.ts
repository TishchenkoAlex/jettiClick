import * as Queue from 'bull';
import { sdbq } from '../../mssql';
import { lib } from '../../std.lib';


export default async function (job: Queue.Job) {
  console.log('start job: ', job.name);
  await job.progress(0);
  const params = job.data;
  const query = `
    SELECT id FROM "Documents"
    WHERE (1=1) AND
      type = @p1 AND
      company = @p2 AND
      date between @p3 AND @p4
    ORDER BY
      date`;

  const startDate = new Date(params.StartDate);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(params.EndDate);
  endDate.setUTCHours(23, 59, 59, 999);

  const list = await sdbq.manyOrNone<any>(query, [params.type, params.company, startDate.toJSON(), endDate.toJSON()]);
  if (list && list.length) {
    job.data.job['total'] = list.length;
    await job.update(job.data);
    for (let i = 1; i <= list.length; i++) {
      await lib.doc.postById(list[i - 1].id, true, sdbq);
      await job.progress(Math.round(i / list.length * 100));
    }
  }
  await job.progress(100);
}
