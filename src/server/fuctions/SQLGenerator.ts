// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
// tslint:disable:forin

export class SQLGenegator {

  static QueryObject(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  coalesce((d.doc ->> '${prop}')::BOOLEAN, false) "${prop}"\n`; }
      if (type === 'number') { return `,  (d.doc ->> '${prop}')::NUMERIC(15,2) "${prop}"\n`; }
      return `, d.doc ->> '${prop}' "${prop}"\n`;
    }

    const complexProperty = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        `,  CASE WHEN "${prop}".id IS NULL THEN d.doc -> '${prop}'
              ELSE jsonb_build_object('id', "${prop}".id, 'value', "${prop}".description,
              'type', coalesce("${prop}".type, '${type}'), 'code', "${prop}".code) END "${prop}"\n` :

        `, jsonb_build_object('id', "${prop}".id, 'value', "${prop}".description, 'type', '${type}', 'code', "${prop}".code) "${prop}"\n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = d.doc ->> '${prop}'\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = d.doc ->> '${prop}' AND "${prop}".type = '${type}'\n`;

    const tableProperty = (prop: string, value: any) => {

      const simleProperty = (prop: string, type: string) => {
        if (type === 'boolean') { return `, '${prop}', coalesce(x."${prop}", false) \n`; }
        if (type === 'number') { return `, '${prop}', (x."${prop}")::NUMERIC(15,2) \n`; }
        return `, '${prop}', x."${prop}"\n`;
      }

      const complexProperty = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          `, '${prop}', jsonb_build_object('id', "${prop}".type, 'value', "${prop}".description, 'type', '${type}', 'code', "${prop}".type)\n` :
          type.startsWith('Types.') ?
            `, '${prop}', CASE WHEN "${prop}".id IS NULL AND d.doc -> '${prop}' IS NOT NULL THEN d.doc -> '${prop}' ELSE
                            jsonb_build_object('id', "${prop}".id, 'value', "${prop}".description, 'type', coalesce("${prop}".type, '${type}'), 'code', "${prop}".code) END\n` :
            `, '${prop}', jsonb_build_object('id', "${prop}".id, 'value', "${prop}".description, 'type', '${type}', 'code', "${prop}".code)\n`;

      const addLeftJoin = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          ` LEFT JOIN "config_schema" "${prop}" ON "${prop}".type = x."${prop}"\n` :
          type.startsWith('Types.') ?
            ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = x."${prop}"\n` :
            ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = x."${prop}" AND "${prop}".type = '${type}'\n`;

      function xTableLine(prop: string, type: string) {
        switch (type) {
          case 'number': return `, "${prop}" NUMERIC\n`;
          case 'boolean': return `, "${prop}" BOOLEAN\n`;
          case 'date': return `, "${prop}" TIMESTAMP(0) WITHOUT TIME ZONE\n`;
          case 'datetime': return `, "${prop}" TIMESTAMP(0) WITH TIME ZONE\n`;
          default: return `, "${prop}" TEXT\n`;
        }
      }

      let query = ''; let LeftJoin = ''; let xTable = '';
      for (const prop in value) {
        const type: string = value[prop].type || 'string';
        if (type.includes('.')) {
          query += complexProperty(prop, type);
          LeftJoin += addLeftJoin(prop, type);
          xTable += `, "${prop}" VARCHAR(36)\n`
        } else {
          query += simleProperty(prop, type);
          xTable += xTableLine(prop, type);
        }
      }
      query = query.slice(2); xTable = xTable.slice(2);

      return `,
        coalesce((SELECT replace(replace(jsonb_agg(j)::TEXT, '{"${prop}":', ''), '}}', '}')::JSONB FROM (
          SELECT jsonb_build_object(${query}) "${prop}"
          FROM "Documents" di,
          jsonb_to_recordset(d.doc->'${prop}') as x (${xTable})
          ${LeftJoin}
          WHERE di.id = d.id) j),
        '[]') "${prop}"\n`;
    }

    let query = `
      SELECT
      d.id, d.type, d.date, d.code, d.description, d.posted, d.deleted, d.isfolder,d.info,
      jsonb_build_object('id', "parent".id, 'value', "parent".description, 'type',
        coalesce("parent".type, 'Types.Document'), 'code', "parent".code) "parent",
      jsonb_build_object('id', "user".id, 'value', "user".description, 'type', 'Catalog.User', 'code', "user".code) "user",
      jsonb_build_object('id', "company".id, 'value', "company".description, 'type', 'Catalog.Company', 'code', "company".code) "company"\n`;
    let LeftJoin = '';

    for (const prop in excludeProps(doc)) {
      const type: string = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
        LeftJoin += addLeftJoin(prop, type);
      } else if (type === 'table') {
        query += tableProperty(prop, (<any>doc[prop])[prop])
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
      WHERE d.type = '${type}'`;
    return query;
  }

  static QueryList(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  coalesce((d.doc ->> '${prop}')::BOOLEAN, false) "${prop}"\n`; }
      if (type === 'number') { return `,  (d.doc ->> '${prop}')::NUMERIC(15,2) "${prop}"\n`; }
      return `, d.doc ->> '${prop}' "${prop}"\n`;
    }

    const complexProperty = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        `, coalesce("${prop}".description, d.doc->'${prop}'->>'value') "${prop}"\n` :
        `, "${prop}".description "${prop}"\n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = d.doc ->> '${prop}'\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = d.doc ->> '${prop}' AND "${prop}".type = '${type}'\n`;


    let query = `SELECT d.id, d.type, d.date, d.code, d.description, d.posted, d.deleted, d.isfolder, d.parent,
            "company".description "company",
            "user".description "user"\n`;

    let LeftJoin = '';

    for (const prop in excludeProps(doc)) {
      const type = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
        LeftJoin += addLeftJoin(prop, type)
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
      WHERE d.type = '${type}'`;

    return query;
  }

  static QueryNew(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, false "${prop}"\n` }
      if (type === 'number') { return `, 0 "${prop}"\n` }
      return `, '' "${prop}"\n`;
    }

    const complexProperty = (prop: string, type: string) =>
      `, '{"id": "", "code": "", "type": "${type}", "value": ""}':: JSONB "${prop}"\n`;

    let query = '';

    for (const prop in excludeProps(doc)) {
      const type: string = doc[prop].type || 'string';
      if (type.includes('.')) {
        query += complexProperty(prop, type);
      } else if (type !== 'table') {
        query += simleProperty(prop, type);
      }
    }

    query = `
      SELECT
      uuid_generate_v1mc() id,
      now() date,
      '${type}' "type",
      (SELECT prifix from config_schema where type = '${type}') || '-' ||
        trim(to_char((SELECT nextval(coalesce((SELECT generator from config_schema where type = '${type}'), 'common_generator'))), '0000000')) code,
      (SELECT description from config_schema where type = '${type}') || '...' description,
      false posted,
      false deleted,
      false isfolder,
      '' info,
      '{"id": "", "code": "", "type": "${type}", "value": ""}':: JSONB "parent",
      '{"id": "", "code": "", "type": "Catalog.User", "value": ""}':: JSONB "user",
      '{"id": "", "code": "", "type": "Catalog.Company", "value": ""}':: JSONB "company"
      ${query}`;
    return query;
  }

}

export function excludeProps(doc) {
  const { user, company, parent, info, isfolder, description, id, type, date, code, posted, deleted, ...newObject } = doc;
  return newObject;
}
