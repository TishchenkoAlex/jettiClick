import * as Queue from 'bull';

import { Events } from '../../routes/events';
import post, { Add as AddPost } from './post';

export interface IBackgroundTask { name: string, func: (job) => Promise<any>, params?: any, shedule?: string }

export const BackgroundTasks: IBackgroundTask[] = [
  {
    name: 'post1', func: post, params: {
      type: 'Document.Invoice',
      company: 'PHARM',
      StartDate: '2017-01-12',
      EndDate: '2017-01-12'
    }
  },
  {
    name: 'post2', func: post, params: {
      type: 'Document.Invoice',
      company: 'PHARM',
      StartDate: '2017-01-13',
      EndDate: '2017-01-13'
    }
  },
  {
    name: 'post3', func: post, params: {
      type: 'Document.Invoice',
      company: 'PHARM',
      StartDate: '2017-01-14',
      EndDate: '2017-01-14'
    }
  }
]

const JQueue = new Queue('BackgroundTasks');
JQueue.clean(0);

JQueue.on('error', err => {
  console.log('error', err);
  // Events.updateProgress(job.id.toString(), 100, new Date())
})

JQueue.on('progress', (job, progress) => {
  console.log('progress', job.data.task, progress);
  Events.updateProgress(job.data.event.id, progress)
})

JQueue.on('completed', async job => {
  console.log('completed', job.data.task);
  await Events.updateProgress(job.data.event.id, 100, new Date())
})

JQueue.process(10, async job => {
  const task = BackgroundTasks.find(el => el.name === job.data.task);
  if (task) {
    const event = await Events.create(job.data.task, 'Queue');
    job.data.event = event;
    await task.func(job);
  }
})
/*
BackgroundTasks.forEach(el => JQueue.add(
  { task: el.name, params: el.params },
  el.shedule ? { repeat: { cron: el.shedule } } : undefined))
 */
// docker run --rm -it -p 6379:6379 redis:alpine
/*
AddPost({
  user: 'tischenko.a@gmail.com',
  type: 'Document.Invoice',
  company: 'PHARM',
  StartDate: '2017-01-12',
  EndDate: '2017-01-12'
})
 */
