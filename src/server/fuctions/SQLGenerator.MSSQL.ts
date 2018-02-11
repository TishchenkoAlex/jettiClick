import { DocumentOptions } from './../models/document';

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
// tslint:disable:forin

export class SQLGenegator {

  static QueryObject(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$.${prop}') AS BIT), 0) "${prop}"\n`; }
      if (type === 'number') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$.${prop}') AS NUMERIC(15,2)), 0) "${prop}"\n`; }
      return `, JSON_VALUE(d.doc, '$.${prop}') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        `,  CASE WHEN "${prop}".id IS NULL THEN JSON_VALUE(d.doc, '$.${prop}')
              ELSE "${prop}".id "${prop}.id", "${prop}".description "${prop}.value",
                ISNULL("${prop}".type, '${type}') "${prop}.type", "${prop}".code "${prop}.code") END "${prop}"\n` :
        `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$.${prop}')\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$.${prop}') AND "${prop}".type = '${type}'\n`;

    const tableProperty = (prop: string, value: any) => {

      const simleProperty = (prop: string, type: string) => {
        if (type === 'boolean') { return `, ISNULL(x."${prop}", 0) "${prop}" \n`; }
        if (type === 'number') { return `, ISNULL(x."${prop}", 0)  "${prop}" \n`; }
        return `, x."${prop}"\n`;
      };

      const complexProperty = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          `, "${prop}".type "${prop}.id", "${prop}".description "${prop}.value", ${type}' "${prop}.type", "${prop}".type "${prop}.code")\n` :
          type.startsWith('Types.') ?
            `,  CASE WHEN "${prop}".id IS NULL THEN JSON_VALUE(d.doc, '$.${prop}')
              ELSE "${prop}".id "${prop}.id", "${prop}".description "${prop}.value",
                ISNULL("${prop}".type, '${type}') "${prop}.type", "${prop}".code "${prop}.code") END "${prop}"\n` :
            `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

      const addLeftJoin = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          ` LEFT JOIN "config_schema" "${prop}" ON "${prop}".type = x."${prop}"\n` :
          type.startsWith('Types.') ?
            ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = x."${prop}"\n` :
            ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = x."${prop}" AND "${prop}".type = '${type}'\n`;

      function xTableLine(prop: string, type: string) {
        switch (type) {
          case 'number': return `, "${prop}" NUMERIC\n`;
          case 'boolean': return `, "${prop}" BIT\n`;
          case 'date': return `, "${prop}" DATE\n`;
          case 'datetime': return `, "${prop}" DATETIME\n`;
          default: return `, "${prop}" NVARCHAR(max)\n`;
        }
      }

      let query = ''; let LeftJoin = ''; let xTable = '';
      for (const prop in value) {
        const type: string = value[prop].type || 'string';
        if (type.includes('.')) {
          query += complexProperty(prop, type);
          LeftJoin += addLeftJoin(prop, type);
          xTable += `, "${prop}" UNIQUEIDENTIFIER\n`;
        } else {
          query += simleProperty(prop, type);
          xTable += xTableLine(prop, type);
        }
      }
      query = query.slice(2); xTable = xTable.slice(2);

      return `,
      (SELECT
        ${query}
      FROM OPENJSON(d.doc, '$.${prop}') WITH (
        ${xTable}
      ) AS x
      ${LeftJoin}
      FOR JSON PATH, INCLUDE_NULL_VALUES) "${prop}"\n`;
    };

    let query = `
    SELECT d.id, d.type, d.date, d.time, d.code, d.description, d.posted, d.deleted, d.isfolder, d.info, d.timestamp,

    "company".id "company.id",
    "company".description "company.value",
    "company".code "company.code",
    'Catalog.Company' "company.type",

    "user".id "user.id",
    "user".description "user.value",
    "user".code "user.code",
    'Catalog.User' "user.type",

    "parent".id "parent.id",
    "parent".description "parent.value",
    "parent".code "parent.code",
    ISNULL("parent".type, 'Types.Document') "parent.type"\n`;

    let LeftJoin = '';

    for (const prop in excludeProps(doc)) {
      const type: string = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
        LeftJoin += addLeftJoin(prop, type);
      } else if (type === 'table') {
        query += tableProperty(prop, (<any>doc[prop])[prop]);
      } else {
        query += simleProperty(prop, type);
      }
    }

    query += `
      FROM "Documents" d
      LEFT JOIN "Documents" "parent" ON "parent".id = d."parent"
      LEFT JOIN "Documents" "user" ON "user".id = d."user" AND "user".type = 'Catalog.User'
      LEFT JOIN "Documents" "company" ON "company".id = d.company AND "company".type = 'Catalog.Company'
      ${LeftJoin}
      WHERE d.type = '${options.type}'`;
    return query;
  }

  static QueryList(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$.${prop}') AS BIT), 0) "${prop}"\n`; }
      if (type === 'number') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$.${prop}') AS NUMERIC(15,2)), 0) "${prop}"\n`; }
      return `, JSON_VALUE(d.doc, '$.${prop}') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        `, ISNULL("${prop}".description, JSON_VALUE(d.doc, '$.${prop}.value')) "${prop}"\n` :
        `, ISNULL("${prop}".description, '') "${prop}"\n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$.${prop}')\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$.${prop}') AND "${prop}".type = '${type}'\n`;


    let query = `SELECT d.id, d.type, d.date, d.code, d.description, d.posted, d.deleted, d.isfolder, d.parent, d.timestamp,
            ISNULL("company".description, '') "company",
            ISNULL("user".description, '') "user"\n`;

    let LeftJoin = '';

    for (const prop in excludeProps(doc)) {
      const type = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
        LeftJoin += addLeftJoin(prop, type);
      } else if (type !== 'table') {
        query += simleProperty(prop, type);
      }
    }

    query += `
      FROM "Documents" d
      LEFT JOIN "Documents" "parent" ON "parent".id = d."parent"
      LEFT JOIN "Documents" "user" ON "user".id = d."user" AND "user".type = 'Catalog.User'
      LEFT JOIN "Documents" "company" ON "company".id = d.company AND "company".type = 'Catalog.Company'
      ${LeftJoin}
      WHERE d.type = '${options.type}'  `;

    return query;
  }

  static QueryNew(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, false "${prop}"\n`; }
      if (type === 'number') { return `, 0 "${prop}"\n`; }
      return `, '' "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, '{"id": null, "code": null, "type": "${type}", "value": null}':: JSONB "${prop}"\n`;

    let query = '';

    for (const prop in excludeProps(doc)) {
      const type: string = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
      } else if (type !== 'table') {
        query += simleProperty(prop, type);
      }
    }

    const code =
      query = `
      SELECT
      uuid_generate_v1mc() id,
      now() date,
      '${options.type}' "type",
      ${options.prefix ? `'${options.prefix}'` : `''`}
      ${options.prefix ? ` || trim(to_char((SELECT nextval('"SEQ.${options.type}"')), '000000000'))` : `''`} code,
      ${options.type.startsWith('Document.') ?
        `'${options.description} #' ||
         ${options.prefix ? `'${options.prefix}'` : `''`}
         ${options.prefix ? ` || trim(to_char((SELECT currval('"SEQ.${options.type}"')), '000000000'))` : `''`} || to_char(now(), ', YYYY-MM-DD HH24:MI:SS')` : `''`} description,
      false posted,
      false deleted,
      false isfolder,
      '' info,
      '{"id": null, "code": null, "type": "${options.type}", "value": null}':: JSONB "parent",
      '{"id": null, "code": null, "type": "Catalog.User", "value": null}':: JSONB "user",
      '{"id": null, "code": null, "type": "Catalog.Company", "value": null}':: JSONB "company"
      ${query}`;
    return query;
  }

  static QueryRegisterAccumulatioList(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  coalesce((r.data ->> '${prop}')::BOOLEAN, false) "${prop}"\n`; }
      if (type === 'number') { return `,  (r.data ->> '${prop}')::NUMERIC(15,2) "${prop}"\n`; }
      return `, r.data ->> '${prop}' "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, jsonb_build_object('id', "${prop}".id, 'value', "${prop}".description, 'type', '${type}', 'code', "${prop}".code) "${prop}"\n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = r.data ->> '${prop}'\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = r.data ->> '${prop}' AND "${prop}".type = '${type}'\n`;

    let LeftJoin = ''; let select = '';
    for (const prop in excludeRegisterAccumulatioProps(doc)) {
      const type: string = doc[prop].type || 'string';
      if (type.includes('.')) {
        select += complexProperty(prop, type);
        LeftJoin += addLeftJoin(prop, type);
      } else {
        select += simleProperty(prop, type);
      }
    }

    const query = `
      SELECT r.date, r."kind",
      jsonb_build_object('id', company.id, 'type', company.type, 'code', company.code, 'value', company.description) "company"
      ${select}
      FROM "Register.Accumulation" r
        LEFT JOIN "Documents" company ON company.id = r.data->>'company'
        ${LeftJoin}
      WHERE r.data @> '{"type": "${type}"}'\n`;
    return query;
  }

  static QueryRegisterInfoList(doc: { [x: string]: any }, type: string) {
    return this.QueryRegisterAccumulatioList(doc, type);
  }
}

export function excludeProps(doc) {
  const { user, company, parent, info, isfolder, description, id, type, date, code, posted, deleted, timestamp, ...newObject } = doc;
  return newObject;
}

export function excludeRegisterAccumulatioProps(doc) {
  const { kind, date, type, company, ...newObject } = doc;
  return newObject;
}

export function excludeRegisterInfoProps(doc) {
  const { kind, date, type, company, ...newObject } = doc;
  return newObject;
}


export function buildTypesQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      '${row.type}' "type",
      '${row.type}' code,
      '${row.description}' description,
      TRUE posted,
      FALSE deleted,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE TRUE `;
  return query;
}

export function buildSubcountQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      'Catalog.Subcount' "type",
      '${row.type}' code,
      '${row.description}' description,
      TRUE posted,
      FALSE deleted,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE TRUE `;
  return query;
}
