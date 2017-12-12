import { Request, Response } from 'express';

import { createDocumentServer } from '../../models/documents.factory.server';
import { DocTypes } from '../../models/documents.types';
import { db } from './../../db';
import { DocListRequestBody } from './../../models/api';
import { FilterInterval, FormListFilter } from './../../models/user.settings';

export async function List(req: Request, res: Response) {
    const params = req.body as DocListRequestBody;
    params.command = params.command || 'first';
    const direction = params.command !== 'prev';
    const newDoc = createDocumentServer(params.type as DocTypes);
    let config_schema;
    if (!newDoc) {
        config_schema = await db.one(`SELECT "queryList" FROM config_schema WHERE type = $1`, [params.type]);
    } else {
      config_schema  = { queryList : newDoc.QueryList() }
    }
    const row = await db.oneOrNone(`SELECT row_to_json(q) "row" FROM (${config_schema.queryList} AND d.id = $1) q`, [params.id]);
    const valueOrder: { field: string, order: 'asc' | 'desc', value: any }[] = [];
    params.order.filter(el => el.order !== '').forEach(el => {
      valueOrder.push({ field: el.field, order: el.order || 'asc', value: row ? row['row'][el.field] || '' : null });
    });
    if (!row && params.command !== 'last') { params.command = 'first' }
    const lastORDER = valueOrder.length ? valueOrder[valueOrder.length - 1].order === 'asc' : true;
    valueOrder.push({ field: 'id', order: lastORDER ? 'asc' : 'desc', value: params.id });

    let orderbyBefore = ' ORDER BY '; let orderbyAfter = orderbyBefore;
    valueOrder.forEach(o => orderbyBefore += '"' + o.field + (o.order === 'asc' ? '" DESC, ' : '" ASC, '))
    orderbyBefore = orderbyBefore.slice(0, -2);
    valueOrder.forEach(o => orderbyAfter += '"' + o.field + (o.order === 'asc' ? '" ASC, ' : '" DESC, '))
    orderbyAfter = orderbyAfter.slice(0, -2);

    const filterBuilder = (filter: FormListFilter[]) => {
      let where = ' TRUE ';
      filter.filter(f => f.right).forEach(f => {
        let operator = f.center.toString();
        if (f.center === 'like') { operator = 'ILIKE' }
        const value = f.right['value'] || f.right;
        switch (operator) {
          case '=': case '>=': case '<=': case '>': case '<':
            if (value instanceof Array) { // time interval
              if (value[0]) { where += ` AND d."${f.left}" >= '${value[0]}'` }
              if (value[1]) { where += ` AND d."${f.left}" <= '${value[1]}'` }
              break;
            }
            if (typeof value === 'object') { return; }
            where += ` AND d."${f.left}" ${operator} '${value.toString().replace('\'', '\'\'')}'`;
            break;
          case 'ILIKE':
            where += ` AND d."${f.left}" ${operator} '%${(value['value'] || value).toString().replace('\'', '\'\'')}%'`;
            break;
          case 'beetwen':
            const interval = f.right as FilterInterval;
            if (interval.start) { where += ` AND d."${f.left}" >= '${interval.start}'` }
            if (interval.end) { where += ` AND d."${f.left}" <= '${interval.end}'` }
            break;
        }
      });
      return where;
    }

    const queryBuilder = (isAfter) => {
      // tslint:disable-next-line:no-shadowed-variable
      let result = '';
      const order = valueOrder.slice();
      const char1 = lastORDER ? isAfter ? '>' : '<' : isAfter ? '<' : '>';
      valueOrder.filter(o => o.value !== null).forEach(o => {
        let where = filterBuilder(params.filter || []);
        order.filter(_o => _o.value !== null).forEach(_o => where += ` AND "${_o.field}" ${_o !== order[order.length - 1] ? '=' :
          char1 + ((_o.field === 'id') && isAfter ? '=' : '')} '${_o.value}' `);
        order.length--;
        result += `\nSELECT * FROM(SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${lastORDER ?
          (char1 === '>') ? orderbyAfter : orderbyBefore :
          (char1 === '<') ? orderbyAfter : orderbyBefore} LIMIT ${params.count + 1}) "tmp${o.field}"\nUNION ALL`;
      });
      return result.slice(0, -9);
    }

    let query = '';
    if (params.command === 'first') {
      const where = filterBuilder(params.filter || []);
      query = `SELECT * FROM (SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${orderbyAfter} LIMIT ${params.count + 1}) d`;
    } else {
      if (params.command === 'last') {
        const where = filterBuilder(params.filter || []);
        query = `SELECT * FROM (SELECT * FROM(${config_schema.queryList}) d WHERE ${where}\n${orderbyBefore} LIMIT ${params.count + 1}) d`;
      } else {
        const queryBefore = queryBuilder(true);
        const queryAfter = queryBuilder(false);
        query = `${queryBefore} \nUNION ALL\n${queryAfter} `;
      }
      query = `SELECT * FROM (${query}) d ${orderbyAfter}`;
    }
    query = `SELECT d.*,
    (select count(*) FROM "Documents" where parent = d.id) "childs",
    (select count(*) FROM "Documents" where id = d.parent) "parents" FROM (${query}) d`;
    // console.log(query);
    const data = await db.manyOrNone(query);
    let result = [];

    const continuation = { first: null, last: null };
    const calculateContinuation = () => {
      const continuationIndex = data.findIndex(d => d.id === params.id);
      const pageSize = Math.min(data.length, params.count);
      if (params.command === 'first') {
        continuation.first = null;
        continuation.last = data[pageSize];
        result = data.slice(0, pageSize);
      } else {
        if (params.command === 'last') {
          continuation.first = data[data.length - 1 - params.count];
          continuation.last = null
          result = data.slice(-pageSize);
        } else {
          if (direction) {
            continuation.first = data[continuationIndex - params.offset - 1];
            continuation.last = data[continuationIndex + pageSize - params.offset];
            result = data.slice(continuation.first ? continuationIndex - params.offset : 0, continuationIndex + pageSize - params.offset);
            if (result.length < pageSize) {
              const first = Math.max(continuationIndex - params.offset - (pageSize - result.length), 0);
              const last = Math.max(continuationIndex - params.offset + result.length, pageSize);
              continuation.first = data[first - 1];
              continuation.last = data[last + 1];
              result = data.slice(first, last);
            }
          } else {
            continuation.first = data[continuationIndex - pageSize - params.offset];
            continuation.last = data[continuationIndex + 1 - params.offset];
            result = data.slice(continuation.first ?
              continuationIndex - pageSize + 1 - params.offset : 0, continuationIndex + 1 - params.offset);
            if (result.length < pageSize) {
              continuation.first = null;
              continuation.last = data[pageSize + 1];
              result = data.slice(0, pageSize);
            }
          }
        }
      }
    }
    calculateContinuation();
    result.length = Math.min(result.length, params.count);
    return { data: result, continuation: continuation }
}
