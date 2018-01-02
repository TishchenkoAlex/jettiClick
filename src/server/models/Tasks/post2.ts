import * as Queue from 'bull';

export default async function (job: Queue.Job) {
  console.log('start', job.data.task);
}
