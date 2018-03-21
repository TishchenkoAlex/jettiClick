import * as Queue from 'bull';

import { sdb } from '../../mssql';
import { lib } from '../../std.lib';
import { DocumentBase } from '../document';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { userSocketsEmit } from '../../sockets';
import { mapJob } from './tasks';

export default async function (job: Queue.Job) {
  await job.progress(0);
  const params = job.data;
  const doc = params.doc as DocumentBase;
  const Inventory = params.Inventory as RegisterAccumulationInventory[];

  let list = [];
  for (const r of Inventory) {
    const query = `
    SELECT date, document from "Register.Accumulation.Inventory"
    WHERE [Qty.Out] <> 0
      AND date >= @p1
      AND company = @p2
      AND Storehouse = @p3
      AND SKU = @p4
      AND batch = @p5
      AND document <> @p6
    GROUP BY date, document
    `;
    list = [...list, ...(await sdb.manyOrNone<any>(query,
      [doc.date, doc.company, r.data.Storehouse, r.data.SKU, r.data.batch, doc.id]))];

    const TaskList = [];
    const count = list.length; let offset = 0;
    while (offset < count) {
      let i = 0;
      for (i = 0; i < 10; i++) {
        if (!list[i + offset]) { break; }
        const q = lib.doc.postById(list[i + offset].document, true);
        TaskList.push(q);
      }
      offset = offset + i;
      await Promise.all(TaskList);
      TaskList.length = 0;
      await job.progress(Math.round(offset / count * 100));
    }
  }
  await job.progress(100);
}
