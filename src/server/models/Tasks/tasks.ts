import { QueueOptions } from 'bull';
import * as Queue from 'bull';

import { REDIS_DB_HOST, REDIS_DB_PREFIX } from '../../env/environment';
import { userSocketsEmit } from '../../sockets';
import { IJob } from '../api';
import post from './post';
import post2 from './post2';

export const QueOpts: QueueOptions = { redis: { host: REDIS_DB_HOST }, prefix: REDIS_DB_PREFIX };

export const Tasks = {
  post: post,
  post2: post2,
  FormPostServer: post
};

export const JQueue = new Queue('GLOBAL', QueOpts);
JQueue.process(10, async t => {
  const task = Tasks[t.data.job.id];
  if (task) { await task(t); }
});

JQueue.on('error', err => {
  console.log('error', err.message);
});

JQueue.on('active', (job, jobPromise) => {
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});

JQueue.on('failed', (job, err) => {
  console.log('failed', job.id, err);
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});

JQueue.on('progress', (job, progress: number) => {
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});

JQueue.on('completed', job => {
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});


export function mapJob(j: Queue.Job) {
  const result: IJob = {
    id: j.id.toString(),
    progress: (<any>j)._progress,
    opts: (<any>j).opts,
    delay: (<any>j).delay,
    timestamp: (<any>j).timestamp,
    returnvalue: (<any>j).returnvalue,
    attemptsMade: (<any>j).attemptsMade,
    failedReason: (<any>j).failedReason,
    finishedOn: (<any>j).finishedOn,
    processedOn: (<any>j).processedOn,
    data: j.data
  };
  return result;
}
