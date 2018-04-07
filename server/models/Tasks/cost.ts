import * as Queue from 'bull';

import { sdbq } from '../../mssql';
import { lib } from '../../std.lib';
import { DocumentBase } from '../document';
import { RegisterAccumulationInventory } from '../Registers/Accumulation/Inventory';
import { flow, groupBy, map, tap, chain } from 'lodash';

export default async function (job: Queue.Job) {
  await job.progress(0);
  const params = job.data;
  const doc = params.doc as DocumentBase;
  const oldInventory = params.Inventory[0];
  const newInventory = params.Inventory[1] as RegisterAccumulationInventory[];
  const Inventory: { batch: string, company: string, SKU: string, Storehouse: string }[] = [
    ...oldInventory.map(el => ({ batch: el.data.batch, company: el.company, SKU: el.data.SKU, Storehouse: el.data.Storehouse })),
    ...newInventory.map(el => ({ batch: el.data.batch, company: doc.company, SKU: el.data.SKU, Storehouse: el.data.Storehouse })),
  ];

  const grouped = Inventory
    .map(r => r.Storehouse + r.SKU + r.company + r.batch)
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(r => Inventory.find(f => f.Storehouse + f.SKU + f.company + f.batch === r));

  let list: any[] = [];
  for (const r of grouped) {
    const query = `
    SELECT s.date, s.document, d.description doc FROM (
    SELECT date, document from "Register.Accumulation.Inventory"
    WHERE [Qty.Out] <> 0
      AND date >= @p1
      AND company = @p2
      AND Storehouse = @p3
      AND SKU = @p4
      AND batch = @p5
      AND document <> @p6
    GROUP BY date, document) s
    LEFT JOIN "Documents" d ON d.id = s.document
    ORDER BY s.date
    `;
    list = [...list, ...(await sdbq.manyOrNone<any>(query,
      [doc.date, r!.company, r!.Storehouse, r!.SKU, r!.batch, doc.id]))];
  }
  const TaskList: any[] = [];
  const count = list.length; let offset = 0;
  job.data['total'] = list.length;
  await job.update(job.data);
  while (offset < count) {
    let i = 0;
    for (i = 0; i < 25; i++) {
      if (!list[i + offset]) { break; }
      const q = lib.doc.postById(list[i + offset].document, true, sdbq);
      TaskList.push(q);
    }
    offset = offset + i;
    await Promise.all(TaskList);
    TaskList.length = 0;
    await job.progress(Math.round(offset / count * 100));
  }
  await job.progress(100);
}
