import { Request, Response } from 'express';
import { DocumentBase } from '../../models/document';
import { sdb } from '../../mssql';
import { DocListRequestBody } from './../../models/api';
import { configSchema } from './../../models/config';
import { FilterInterval, FormListFilter } from './../../models/user.settings';

export async function List(req: Request, res: Response) {
  const params = req.body as DocListRequestBody;
  if (params.type === 'Document.Operation') return ListOperation(req, res);
  params.filter = params.filter || [];
  params.command = params.command || 'first';
  const direction = params.command !== 'prev';
  const cs = configSchema.get(params.type);
  if (!cs) throw new Error(`List: Error in 'List' function. Type (${params.type}) is not defined.`);
  const { QueryList, Props } = cs;

  let row;
  if (params.id) { row = (await sdb.oneOrNone<any>(`${QueryList} AND d.id = '${params.id}'`)); }
  params.order.forEach(el => el.field += (Props[el.field].type as string).includes('.') ? '.value' : '');
  // tslint:disable-next-line:max-line-length
  params.filter.forEach(el => el.left += (Props[el.left] && Props[el.left].type && (Props[el.left].type as string).includes('.')) ? '.id' : '');
  const valueOrder: { field: string, order: 'asc' | 'desc', value: any }[] = [];
  params.order.filter(el => el.order !== '').forEach(el => {
    const value = row ? el.field.includes('.value') ? row[el.field.split('.')[0]].value : row[el.field] : '';
    valueOrder.push({ field: el.field, order: el.order || 'asc', value: row ? value : '' });
  });
  if (!row && params.command !== 'last') params.command = 'first';
  const lastORDER = valueOrder.length ? valueOrder[valueOrder.length - 1].order === 'asc' : true;
  valueOrder.push({ field: 'id', order: lastORDER ? 'asc' : 'desc', value: params.id });

  let orderbyBefore = ' ORDER BY '; let orderbyAfter = orderbyBefore;
  valueOrder.forEach(o => orderbyBefore += '"' + o.field + (o.order === 'asc' ? '" DESC, ' : '" ASC, '));
  orderbyBefore = orderbyBefore.slice(0, -2);
  valueOrder.forEach(o => orderbyAfter += '"' + o.field + (o.order === 'asc' ? '" ASC, ' : '" DESC, '));
  orderbyAfter = orderbyAfter.slice(0, -2);

  const filterBuilder = (filter: FormListFilter[]) => {
    let where = ' isfolder = 0 ';
    filter.filter(f => !(f.right === null || f.right === undefined)).forEach(f => {
      switch (f.center) {
        case '=': case '>=': case '<=': case '>': case '<':
          if (Array.isArray(f.right)) { // time interval
            if (f.right[0]) where += ` AND d."${f.left}" >= '${f.right[0]}'`;
            if (f.right[1]) where += ` AND d."${f.left}" <= '${f.right[1]}'`;
            break;
          }
          if (typeof f.right === 'object') {
            if (!f.right.id) where += ` AND d."${f.left}" IS NULL `; else where += ` AND d."${f.left}" ${f.center} '${f.right.id}'`;
            break;
          }
          if (typeof f.right === 'string') f.right = f.right.toString().replace('\'', '\'\'');
          if (!f.right) where += ` AND d."${f.left}" IS NULL `; else where += ` AND d."${f.left}" ${f.center} '${f.right}'`;
          break;
        case 'like':
          where += ` AND d."${f.left}" LIKE N'%${(f.right['value'] || f.right).toString().replace('\'', '\'\'')}%' `;
          break;
        case 'beetwen':
          const interval = f.right as FilterInterval;
          if (interval.start) where += ` AND d."${f.left}" BEETWEN '${interval.start}' AND '${interval.end}' `;
          break;
        case 'is null':
          where += ` AND d."${f.left}" IS NULL `;
          break;
      }
    });
    return where;
  };

  const filterBuilderForDoc = (filter: FormListFilter[]) => {
    let where = ' ';
    filter.forEach(f => {
      const field = f.left.split('.')[0];
      if (field !== 'parent' && field !== 'user' && field !== 'company' && f.right && f.right.id) {
        where += `\nAND CAST(JSON_VALUE(d.doc, N'$."${field}"') AS UNIQUEIDENTIFIER) = '${f.right.id}' `;
        return;
      }
    });
    return where;
  };

  const queryBuilder = (isAfter) => {
    // tslint:disable-next-line:no-shadowed-variable
    let result = '';
    const order = valueOrder.slice();
    const char1 = lastORDER ? isAfter ? '>' : '<' : isAfter ? '<' : '>';
    valueOrder.filter(o => o.value !== null).forEach(o => {
      let where = filterBuilder(params.filter);
      order.filter(_o => _o.value !== null).forEach(_o => where += ` AND "${_o.field}" ${_o !== order[order.length - 1] ? '=' :
        char1 + ((_o.field === 'id') && isAfter ? '=' : '')} '${_o.value instanceof Date ? _o.value.toJSON() : _o.value}' `);
      order.length--;
      const addQuery = `\nSELECT * FROM(SELECT * FROM(${QueryList} ${filterBuilderForDoc(params.filter)}) d
        WHERE ${where}\n${lastORDER ?
          (char1 === '>') ? orderbyAfter : orderbyBefore :
          (char1 === '<') ? orderbyAfter : orderbyBefore} OFFSET 0 ROWS FETCH NEXT ${params.count + 1} ROWS ONLY) d`;

      result += `SELECT * FROM (${addQuery}) "tmp${o.field}"\nUNION ALL\n`;
    });
    return result.slice(0, -11);
  };

  let query = '';
  if (params.command === 'first') {
    const where = filterBuilder(params.filter || []);
    query = `SELECT * FROM (SELECT * FROM(${QueryList} ${filterBuilderForDoc(params.filter)}) d
      WHERE ${where}\n${orderbyAfter} OFFSET 0 ROWS FETCH NEXT ${params.count + 1} ROWS ONLY) d`;
  } else {
    if (params.command === 'last') {
      const where = filterBuilder(params.filter || []);
      query = `SELECT * FROM (SELECT * FROM(${QueryList} ${filterBuilderForDoc(params.filter)}) d
        WHERE ${where}\n${orderbyBefore} OFFSET 0 ROWS FETCH NEXT ${params.count + 1} ROWS ONLY) d`;
    } else {
      const queryBefore = queryBuilder(true);
      const queryAfter = queryBuilder(false);
      query = `${queryBefore} \nUNION ALL\n${queryAfter} `;
    }
  }
  query = `SELECT d.* FROM (${query}) d ${orderbyAfter} `;
  // console.log(query);
  const data = await sdb.manyOrNone<any>(query);
  let result: any[] = [];

  const continuation = { first: null, last: null };
  const calculateContinuation = () => {
    const continuationIndex = data.findIndex(d => d.id === params.id);
    const pageSize = Math.min(data.length, params.count);
    switch (params.command) {
      case 'first':
        continuation.first = null;
        continuation.last = data[pageSize];
        result = data.slice(0, pageSize);
        break;
      case 'last':
        continuation.first = data[data.length - 1 - params.count];
        continuation.last = null;
        result = data.slice(-pageSize);
        break;
      default:
        if (direction) {
          continuation.first = data[continuationIndex - params.offset - 1];
          continuation.last = data[continuationIndex + pageSize - params.offset];
          result = data.slice(continuation.first ? continuationIndex - params.offset : 0,
            continuationIndex + pageSize - params.offset);
          if (result.length < pageSize) {
            const first = Math.max(continuationIndex - params.offset - (pageSize - result.length), 0);
            const last = Math.max(continuationIndex - params.offset + result.length, pageSize);
            continuation.first = data[first - 1];
            continuation.last = data[last + 1] || data[last];
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
  };
  calculateContinuation();
  result.length = Math.min(result.length, params.count);
  return { data: result, continuation: continuation };
}

export async function List2(req: Request, res: Response) {
  const params = req.body as DocListRequestBody;
  params.filter = params.filter || [];
  params.command = params.command || 'first';
  const direction = params.command !== 'prev';
  const cs = configSchema.get(params.type);
  const { QueryList, Props, QueryObject } = cs!;

  let row: DocumentBase | null = null;
  if (!row && params.command !== 'last') params.command = 'first';

  const QueryListWithoutWhere = QueryList.slice(0, QueryList.indexOf('WHERE d.[type] ='));

  if (params.id) { row = (await sdb.oneOrNone<DocumentBase>(`${QueryListWithoutWhere} WHERE d.id = '${params.id}'`)); }
  params.order.forEach(el => el.field += (Props[el.field].type as string).includes('.') ? '.value' : '');

  params.filter.forEach(el => el.left += (Props[el.left] && Props[el.left].type && (Props[el.left].type as string).includes('.')) ? '.id' : '');
  const valueOrder: { field: string, order: 'asc' | 'desc', value: any }[] = [];
  params.order.filter(el => el.order !== '').forEach(el => {
    const value = row ? el.field.includes('.value') ? row[el.field.split('.')[0]].value : row[el.field] : '';
    valueOrder.push({ field: el.field, order: el.order || 'asc', value: row ? value : '' });
  });

  const lastORDER = valueOrder.length ? valueOrder[valueOrder.length - 1].order === 'asc' : true;
  valueOrder.push({ field: 'id', order: lastORDER ? 'asc' : 'desc', value: params.id });

  let orderbyBefore = ' ORDER BY '; let orderbyAfter = orderbyBefore;
  valueOrder.forEach(o => orderbyBefore += '"' + o.field + (o.order === 'asc' ? '" DESC, ' : '" ASC, '));
  orderbyBefore = orderbyBefore.slice(0, -2);
  valueOrder.forEach(o => orderbyAfter += '"' + o.field + (o.order === 'asc' ? '" ASC, ' : '" DESC, '));
  orderbyAfter = orderbyAfter.slice(0, -2);

  const filterBuilder = (filter: FormListFilter[]) => {
    let where = ` type = '${params.type}' AND isfolder = 0 `;
    filter.filter(f => !(f.right === null || f.right === undefined)).forEach(f => {
      switch (f.center) {
        case '=': case '>=': case '<=': case '>': case '<':
          if (Array.isArray(f.right)) { // time interval
            if (f.right[0]) where += ` AND "${f.left}" >= '${f.right[0]}'`;
            if (f.right[1]) where += ` AND "${f.left}" <= '${f.right[1]}'`;
            break;
          }
          if (typeof f.right === 'object') {
            const field = f.left.split('.')[0];
            if (field !== 'parent' && field !== 'user' && field !== 'company' && f.right && f.right.id) {
              where += `\nAND CAST(JSON_VALUE(doc, N'$."${field}"') AS UNIQUEIDENTIFIER) ${f.center} '${f.right.id}' `;
            } else
              if (!f.right.id) where += ` AND "${field}" IS NULL `; else where += ` AND "${field}" ${f.center} '${f.right.id}'`;
            break;
          }
          if (typeof f.right === 'string') f.right = f.right.toString().replace('\'', '\'\'');
          if (!f.right) where += ` AND "${f.left}" IS NULL `; else where += ` AND "${f.left}" ${f.center} '${f.right}'`;
          break;
        case 'like':
          where += ` AND "${f.left}" LIKE N'%${(f.right['value'] || f.right).toString().replace('\'', '\'\'')}%' `;
          break;
        case 'beetwen':
          const interval = f.right as FilterInterval;
          if (interval.start) where += ` AND "${f.left}" BEETWEN '${interval.start}' AND '${interval.end}' `;
          break;
        case 'is null':
          where += ` AND "${f.left}" IS NULL `;
          break;
      }
    });
    return where;
  };

  const queryBuilder = (isAfter) => {
    let _result = '';
    const order = valueOrder.slice();
    const char1 = lastORDER ? isAfter ? '>' : '<' : isAfter ? '<' : '>';
    valueOrder.filter(o => o.value).forEach(o => {
      let where = filterBuilder(params.filter);
      order.filter(_o => _o.value).forEach(_o => where += ` AND "${_o.field}" ${_o !== order[order.length - 1] ? '=' :
        char1 + ((_o.field === 'id') && isAfter ? '=' : '')} '${_o.value instanceof Date ? _o.value.toJSON() : _o.value}' `);
      order.length--;
      const addQuery = `\nSELECT id FROM(SELECT TOP ${params.count + 1} id FROM dbo."Documents" ID
        WHERE ${where}\n${lastORDER ?
          (char1 === '>') ? orderbyAfter : orderbyBefore :
          (char1 === '<') ? orderbyAfter : orderbyBefore}) ID\n UNION ALL`;

      _result += addQuery;
    });
    return _result.slice(0, -11);
  };

  let query = '';
  const queryBefore = queryBuilder(true);
  const queryAfter = queryBuilder(false);
  if (queryBefore) {
    query = `SELECT id FROM (${queryBefore} \nUNION ALL\n${queryAfter}) ID)`;
    query = `SELECT * FROM (${QueryListWithoutWhere} WHERE d.id IN (${query}) d ${orderbyAfter} --OPTION (TABLE HINT(d, INDEX ([PK_Documents])))`;
  } else query = `SELECT TOP ${params.count + 1} * FROM (${QueryList}) d ${orderbyAfter} --OPTION (TABLE HINT(d, INDEX ([PK_Documents])))`;

  const data = await sdb.manyOrNone<any>(query);
  let result: any[] = [];

  const continuation = { first: null, last: null };
  const calculateContinuation = () => {
    const continuationIndex = data.findIndex(d => d.id === params.id);
    const pageSize = Math.min(data.length, params.count);
    switch (params.command) {
      case 'first':
        continuation.first = null;
        continuation.last = data[pageSize];
        result = data.slice(0, pageSize);
        break;
      case 'last':
        continuation.first = data[data.length - 1 - params.count];
        continuation.last = null;
        result = data.slice(-pageSize);
        break;
      default:
        if (direction) {
          continuation.first = data[continuationIndex - params.offset - 1];
          continuation.last = data[continuationIndex + pageSize - params.offset];
          result = data.slice(continuation.first ? continuationIndex - params.offset : 0,
            continuationIndex + pageSize - params.offset);
          if (result.length < pageSize) {
            const first = Math.max(continuationIndex - params.offset - (pageSize - result.length), 0);
            const last = Math.max(continuationIndex - params.offset + result.length, pageSize);
            continuation.first = data[first - 1];
            continuation.last = data[last + 1] || data[last];
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
  };
  calculateContinuation();
  result.length = Math.min(result.length, params.count);
  return { data: result, continuation: continuation };
}

export async function ListOperation(req: Request, res: Response) {
  const params = req.body as DocListRequestBody;
  params.filter = params.filter || [];
  params.command = params.command || 'first';
  const direction = params.command !== 'prev';
  const cs = configSchema.get(params.type);
  const { Props } = cs!;
  const QueryList = `SELECT * FROM [Documents.Operation] `;

  let row: DocumentBase | null = null;

  if (params.id) { row = (await sdb.oneOrNone<DocumentBase>(`${QueryList} d WHERE d.id = '${params.id}'`)); }
  if (!row && params.command !== 'last') params.command = 'first';

  params.order.forEach(el => el.field += (Props[el.field].type as string).includes('.') ? '.value' : '');
  params.filter.forEach(el => el.left += (Props[el.left] && Props[el.left].type && (Props[el.left].type as string).includes('.')) ? '.id' : '');
  const valueOrder: { field: string, order: 'asc' | 'desc', value: any }[] = [];
  params.order.filter(el => el.order !== '').forEach(el => {
    const value = row ? el.field.includes('.value') ? row[el.field.split('.')[0]].value : row[el.field] : '';
    valueOrder.push({ field: el.field, order: el.order || 'asc', value: row ? value : '' });
  });

  const lastORDER = valueOrder.length ? valueOrder[valueOrder.length - 1].order === 'asc' : true;
  valueOrder.push({ field: 'id', order: lastORDER ? 'asc' : 'desc', value: params.id });
  let orderbyBefore = ' ORDER BY '; let orderbyAfter = orderbyBefore;
  valueOrder.forEach(o => orderbyBefore += '"' + o.field + (o.order === 'asc' ? '" DESC, ' : '" ASC, '));
  orderbyBefore = orderbyBefore.slice(0, -2);
  valueOrder.forEach(o => orderbyAfter += '"' + o.field + (o.order === 'asc' ? '" ASC, ' : '" DESC, '));
  orderbyAfter = orderbyAfter.slice(0, -2);

  const filterBuilder = (filter: FormListFilter[]) => {
    let where = ' (1 = 1) ';
    filter.filter(f => !(f.right === null || f.right === undefined)).forEach(f => {
      switch (f.center) {
        case '=': case '>=': case '<=': case '>': case '<':
          if (Array.isArray(f.right)) { // time interval
            if (f.right[0]) where += ` AND "${f.left}" >= '${f.right[0]}'`;
            if (f.right[1]) where += ` AND "${f.left}" <= '${f.right[1]}'`;
            break;
          }
          if (typeof f.right === 'object') {
              if (!f.right.id) where += ` AND "${f.left}" IS NULL `; else where += ` AND "${f.left}" ${f.center} '${f.right.id}'`;
            break;
          }
          if (typeof f.right === 'string') f.right = f.right.toString().replace('\'', '\'\'');
          if (!f.right) where += ` AND "${f.left}" IS NULL `; else where += ` AND "${f.left}" ${f.center} '${f.right}'`;
          break;
        case 'like':
          where += ` AND "${f.left}" LIKE N'%${(f.right['value'] || f.right).toString().replace('\'', '\'\'')}%' `;
          break;
        case 'beetwen':
          const interval = f.right as FilterInterval;
          if (interval.start) where += ` AND "${f.left}" BEETWEN '${interval.start}' AND '${interval.end}' `;
          break;
        case 'is null':
          where += ` AND "${f.left}" IS NULL `;
          break;
      }
    });
    return where;
  };

  const queryBuilder = (isAfter) => {
    let _result = '';
    const order = valueOrder.slice();
    const char1 = lastORDER ? isAfter ? '>' : '<' : isAfter ? '<' : '>';
    const where = filterBuilder(params.filter);
    valueOrder.filter(o => o.value).forEach(o => {
      let _where = where;
      order.filter(_o => _o.value).forEach(_o => _where += ` AND "${_o.field}" ${_o !== order[order.length - 1] ? '=' :
        char1 + ((_o.field === 'id') && isAfter ? '=' : '')} '${_o.value instanceof Date ? _o.value.toJSON() : _o.value}' `);
      order.length--;
      const addQuery = `\nSELECT id FROM(SELECT TOP ${params.count + 1} id FROM [Documents.Operation] ID
        WHERE ${_where}\n${lastORDER ?
          (char1 === '>') ? orderbyAfter : orderbyBefore :
          (char1 === '<') ? orderbyAfter : orderbyBefore}) ID\n UNION ALL`;

      _result += addQuery;
    });
    return _result.slice(0, -11);
  };

  let query = '';
  const queryBefore = queryBuilder(true);
  const queryAfter = queryBuilder(false);
  if (queryBefore) {
    query = `SELECT id FROM (${queryBefore} \nUNION ALL\n${queryAfter}) ID)`;
    query = `SELECT * FROM (${QueryList} d WHERE d.id IN (${query}) d ${orderbyAfter} `;
  } else query = `SELECT TOP ${params.count + 1} * FROM (${QueryList} d WHERE ${filterBuilder(params.filter)}) d ${orderbyAfter} `;

  const data = await sdb.manyOrNone<any>(query);
  let result: any[] = [];

  const continuation = { first: null, last: null };
  const calculateContinuation = () => {
    const continuationIndex = data.findIndex(d => d.id === params.id);
    const pageSize = Math.min(data.length, params.count);
    switch (params.command) {
      case 'first':
        continuation.first = null;
        continuation.last = data[pageSize];
        result = data.slice(0, pageSize);
        break;
      case 'last':
        continuation.first = data[data.length - 1 - params.count];
        continuation.last = null;
        result = data.slice(-pageSize);
        break;
      default:
        if (direction) {
          continuation.first = data[continuationIndex - params.offset - 1];
          continuation.last = data[continuationIndex + pageSize - params.offset];
          result = data.slice(continuation.first ? continuationIndex - params.offset : 0,
            continuationIndex + pageSize - params.offset);
          if (result.length < pageSize) {
            const first = Math.max(continuationIndex - params.offset - (pageSize - result.length), 0);
            const last = Math.max(continuationIndex - params.offset + result.length, pageSize);
            continuation.first = data[first - 1];
            continuation.last = data[last + 1] || data[last];
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
  };
  calculateContinuation();
  result.length = Math.min(result.length, params.count);
  return { data: result, continuation: continuation };
}
