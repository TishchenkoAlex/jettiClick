import * as Queue from 'Bull';

export default async function (job: Queue.Job) {
  console.log('start', job.data.task);
}
