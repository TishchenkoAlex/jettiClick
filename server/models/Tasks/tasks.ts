import { QueueOptions } from 'bull';
import * as Queue from 'bull';

import { REDIS_DB_HOST, DB_NAME } from '../../env/environment';
import { userSocketsEmit } from '../../sockets';
import { IJob } from '../api';
import cost from './cost';
import post from './post';

export const QueOpts: QueueOptions = {
  redis: {
    host: REDIS_DB_HOST,
    reconnectOnError: (err) => <any>2,
    enableOfflineQueue: true,
    autoResendUnfulfilledCommands: true,
  },
  prefix: DB_NAME
};

export const Tasks: { [key: string]: (job: Queue.Job) => Promise<void> } = {
  post: post,
  FormPostServer: post,
  cost: cost
};

export const JQueue = new Queue(DB_NAME, QueOpts);
JQueue.process(5, async t => {
  const task = Tasks[t.data.job.id];
  if (task) await task(t);
});

JQueue.on('error', err => {
  console.log('error', err.message);
});

JQueue.on('active', (job, jobPromise) => {
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});

JQueue.on('failed', async (job, err) => {
  const MapJob = mapJob(job);
  MapJob.failedReason = err.message;
  MapJob.finishedOn = new Date().getTime();
  userSocketsEmit(job.data.userId, 'job', MapJob);
});

JQueue.on('progress', (job, progress: number) => {
  userSocketsEmit(job.data.userId, 'job', mapJob(job));
});

JQueue.on('completed', async job => {
  const MapJob = mapJob(job);
  MapJob.finishedOn = new Date().getTime();
  userSocketsEmit(job.data.userId, 'job', MapJob);
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
    data: { job: j.data.job }
  };
  return result;
}
