import * as Queue from 'Bull';

import { db } from '../../db';
import { Events } from '../../routes/events';
import { lib } from '../../std.lib';

export default async function post(job: Queue.Job) {
  job.progress(0);
  const params = job.data;
  const query = `SELECT id, date, code FROM "Documents"
    WHERE type = $1 AND company = $2 AND date between $3 AND $4 ORDER BY date, code`;
  const TaskList = [];
  const endDate = new Date(params.EndDate);
  endDate.setHours(23, 59, 59, 999);
  const list = await db.manyOrNone(query, [params.type, params.company, params.StartDate, endDate]);
  const count = list.length; let offset = 0;
  while (offset < count) {
    let i = 0;
    for (i = 0; i < 25; i++) {
      if (!list[i + offset]) { break }
      const q = lib.doc.postById(list[i + offset].id, true, db);
      TaskList.push(q);
    }
    offset = offset + i;
    try { await Promise.all(TaskList) } catch (err) { console.log(err) }
    TaskList.length = 0;
    job.progress(Math.round(offset / count * 100));
  }
  job.progress(100);
}

const QueueID = 'post';
const JQueue = new Queue(QueueID);
JQueue.clean(0);
JQueue.process(100, post);

JQueue.on('error', err => {
  console.log('error', err);
  // Events.updateProgress(job.id.toString(), 100, new Date())
})

JQueue.on('active', (job, jobPromise) => {
  console.log('active', job.id);
})

JQueue.on('failed', (job, err) => {
  console.error('failed', job.id, err);
  Events.updateProgress(job.data.event.id, -1, new Date(), err.message);
  job.remove();
})

JQueue.on('progress', (job, progress: number) => {
  console.log('progress', job.id, progress);
  Events.updateProgress(job.data.event.id, progress);
})

JQueue.on('completed', job => {
  console.log('completed', job.id);
  Events.updateProgress(job.data.event.id, 100, new Date());
  job.remove();
})

export function Add(data: any, shedule?: string) {
  Events.create(QueueID, data.user).then(event => {
    data.event = event;
    JQueue.add(data, shedule ? { repeat: { cron: shedule } } : undefined);
  });
}

