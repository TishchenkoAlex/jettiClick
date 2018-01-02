import post from './post';

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

