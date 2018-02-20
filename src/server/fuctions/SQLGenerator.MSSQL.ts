import { createDocument, RegisteredDocument } from '../models/documents.factory';
import { createRegisterAccumulation, RegisteredRegisterAccumulation } from '../models/Registers/Accumulation/factory';
import { DocumentOptions } from './../models/document';

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
// tslint:disable:forin

export class SQLGenegator {

  static QueryObject(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$."${prop}"') AS BIT), 0) "${prop}"\n`; }
      if (type === 'number') { return `,  ISNULL(CAST(JSON_VALUE(d.doc, '$."${prop}"') AS NUMERIC), 0) "${prop}"\n`; }
      return `, JSON_VALUE(d.doc, '$."${prop}"') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        `,  JSON_QUERY(CASE WHEN "${prop}".id IS NULL THEN JSON_QUERY(d.doc, '$.${prop}')
              ELSE (SELECT "${prop}".id "id", "${prop}".description "value",
                ISNULL("${prop}".type, '${type}') "type", "${prop}".code "code" FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) END, '$') "${prop}"\n` :
        `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$."${prop}"')\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(d.doc, '$."${prop}"') AND "${prop}".type = '${type}'\n`;

    const tableProperty = (prop: string, value: any) => {

      const simleProperty = (prop: string, type: string) => {
        if (type === 'boolean') { return `, ISNULL(x."${prop}", 0) "${prop}" \n`; }
        if (type === 'number') { return `, ISNULL(x."${prop}", 0)  "${prop}" \n`; }
        return `, x."${prop}"\n`;
      };

      const complexProperty = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          `, x."${prop}" "${prop}.id", x."${prop}" "${prop}.value", '${type}' "${prop}.type", x."${prop}" "${prop}.code"\n` :
          type.startsWith('Types.') ?
            `,  JSON_QUERY(CASE WHEN "${prop}".id IS NULL THEN JSON_QUERY(d.doc, '$.${prop}')
              ELSE (SELECT "${prop}".id "id", "${prop}".description "value",
                ISNULL("${prop}".type, '${type}') "type", "${prop}".code "code" FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) END, '$') "${prop}"\n` :
            `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

      const addLeftJoin = (prop: string, type: string) =>
        type.startsWith('Catalog.Subcount') ?
          `\n` :
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
          xTable += `, "${prop}" ${type.startsWith('Catalog.Subcount') ? 'VARCHAR(36)' : 'UNIQUEIDENTIFIER'}\n`;
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
      WHERE d.type = '${options.type}' `;
    return query;
  }

  static QueryList(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, ISNULL(CAST(JSON_VALUE(d.doc, '$."${prop}"') AS BIT), 0) "${prop}"\n`; }
      if (type === 'number') { return `, ISNULL(CAST(JSON_VALUE(d.doc, '$."${prop}"') AS NUMERIC(15,2)), 0) "${prop}"\n`; }
      return `, ISNULL(JSON_VALUE(d.doc, '$."${prop}"'), '') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
        `, ISNULL("${prop}".description, '') "${prop}.value", "${prop}".type "${prop}.type", CAST(JSON_VALUE(d.doc, '$."${prop}"') AS UNIQUEIDENTIFIER) "${prop}.id"\n`;

    const addLeftJoin = (prop: string, type: string) =>
        `LEFT JOIN dbo."Documents" "${prop}" ON "${prop}".id = CAST(JSON_VALUE(d.doc, '$."${prop}"') AS UNIQUEIDENTIFIER)\n`;

    let query = `SELECT d.id, d.type, d.date, d.code, d.description, d.posted, d.deleted, d.isfolder, d.parent, d.timestamp
      , ISNULL("company".description, '') "company.value", d."company" "company.id", "company".type "company.type"
      , ISNULL("user".description, '') "user.value", d."user" "user.id", "user".type "user.type"\n`;

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
    FROM dbo."Documents" d
      LEFT JOIN dbo."Documents" "parent" ON "parent".id = d."parent"
      LEFT JOIN dbo."Documents" "user" ON "user".id = d."user"
      LEFT JOIN dbo."Documents" "company" ON "company".id = d.company
      ${LeftJoin}
    WHERE d.type = '${options.type}'  `;

    return query;
  }

  static QueryNew(doc: { [x: string]: any }, options: DocumentOptions) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, 0 "${prop}"\n`; }
      if (type === 'number') { return `, 0 "${prop}"\n`; }
      return `, '' "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, null "${prop}.id", null "${prop}.code", '${type}' "${prop}.type", null "${prop}.value"\n`;

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
      NEWID() id,
      GETDATE() date,
      '${options.type}' "type",
      ${options.prefix ? `'${options.prefix}'` : `''`} +
      ${options.prefix ? ` FORMAT((NEXT VALUE FOR "Sq.${options.type}"), '0000000000')` : `''`} code,
      ${options.type.startsWith('Document.') ?
        `'${options.description} #' +
         ${options.prefix ? `'${options.prefix}'` : `''`} +
         ${options.prefix ? `FORMAT((NEXT VALUE FOR "Sq.${options.type}"), '0000000000')` : `''`} ` : `''`} description,
      0 posted,
      0 deleted,
      0 isfolder,
      '' info
      , null "parent.id", null "parent.code", '${options.type}' "parent.type", null "parent.value"\n
      , null "user.id", null "user.code", 'Catalog.User' "user.type", null "user.value"\n
      , null "company.id", null "company.code", 'Catalog.Company' "company.type", null "company.value"\n
      ${query}`;
    return query;
  }

  static QueryRegisterAccumulatioList(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, ISNULL(JSON_VALUE(r.data, '$.${prop}'), 0) "${prop}"\n`; }
      if (type === 'number') { return `, ISNULL(CAST(JSON_VALUE(r.data, '$.${prop}') AS NUMERIC(15,2)), 0) "${prop}"\n`; }
      return `, JSON_VALUE(r.data, '$.${prop}') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(r.data, '$.${prop}')\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(r.data, '$.${prop}') AND "${prop}".type = '${type}'\n`;

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
      "company".id "company.id", "company".description "company.value", "company".code "company.code", 'Catalog.Company' "company.type"
      ${select}
      FROM "Accumulation" r
        LEFT JOIN "Documents" company ON company.id = r.company AND "company".type = 'Catalog.Company'
        ${LeftJoin}
      WHERE r.type = '${type}'\n`;
    return query;
  }

  static QueryRegisterInfoList(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, ISNULL(JSON_VALUE(r.data, '$.${prop}'), 0) "${prop}"\n`; }
      if (type === 'number') { return `, ISNULL(CAST(JSON_VALUE(r.data, '$.${prop}') AS NUMERIC(15,2)), 0) "${prop}"\n`; }
      return `, JSON_VALUE(r.data, '$.${prop}') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, "${prop}".id "${prop}.id", "${prop}".description "${prop}.value", '${type}' "${prop}.type", "${prop}".code "${prop}.code" \n`;

    const addLeftJoin = (prop: string, type: string) =>
      type.startsWith('Types.') ?
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(r.data, '$.${prop}')\n` :
        ` LEFT JOIN "Documents" "${prop}" ON "${prop}".id = JSON_VALUE(r.data, '$.${prop}') AND "${prop}".type = '${type}'\n`;

    let LeftJoin = ''; let select = '';
    for (const prop in excludeRegisterInfoProps(doc)) {
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
      "company".id "company.id", "company".description "company.value", "company".code "company.code", 'Catalog.Company' "company.type"
      ${select}
      FROM "Register.Info" r
        LEFT JOIN "Documents" company ON company.id = r.company AND "company".type = 'Catalog.Company'
        ${LeftJoin}
      WHERE r.type = '${type}'\n`;
    return query;
  }

  static QueryTriggerRegisterAccumulation(doc: { [x: string]: any }, type: string) {

    const simleProperty = (prop: string, type: string) => {
      if (type === 'boolean') { return `, ISNULL(JSON_VALUE(data, '$.${prop}'), 0) "${prop}"\n`; }
      if (type === 'number') { return `
        , ISNULL(CAST(JSON_VALUE(data, '$.${prop}') AS MONEY), 0) * IIF(kind = 1, 1, -1) "${prop}"
        , ISNULL(CAST(JSON_VALUE(data, '$.${prop}') AS MONEY), 0) * IIF(kind = 1, 1, 0) "${prop}.In"
        , ISNULL(CAST(JSON_VALUE(data, '$.${prop}') AS MONEY), 0) * IIF(kind = 1, 0, 1) "${prop}.Out"\n`;
      }
      return `, JSON_VALUE(data, '$.${prop}') "${prop}"\n`;
    };

    const complexProperty = (prop: string, type: string) =>
      `, CAST(JSON_VALUE(data, '$."${prop}"') AS UNIQUEIDENTIFIER) "${prop}"\n`;

    let insert = ''; let select = '';
    for (const prop in excludeRegisterAccumulatioProps(doc)) {
      const type: string = doc[prop].type || 'string';
      insert += `, "${prop}"\n`;
      if (type === 'number') {
        insert += `, "${prop}.In"\n, "${prop}.Out"\n`;
      }

      if (type.includes('.')) {
        select += complexProperty(prop, type);
      } else {
        select += simleProperty(prop, type);
      }
    }

    const query = `
      INSERT INTO "${type}"
      (date, document, company, kind ${insert})
      SELECT
        CAST(date AS DATE) date,
        document,
        company,
        kind
        ${select}
      FROM INSERTED WHERE type = '${type}';\n`;
    return query;
  }

  static AlterTriggerRegisterAccumulation() {
    let query = '';
    for (const type of RegisteredRegisterAccumulation) {
      const register = createRegisterAccumulation(type.type, true, {});
      query += SQLGenegator.QueryTriggerRegisterAccumulation(register.Props(), register.Prop().type);
    }

    query = `
    ALTER TRIGGER "Accumulation.Insert" ON dbo."Accumulation"
    FOR INSERT AS
    BEGIN
      ${query}
    END;`;
    return query;
  }

  static CreateTableRegisterAccumulation() {

    const simleProperty = (prop: string, type: string, required: boolean) => {
      const nullText = required ? ' NOT NULL ' : ' NULL ';
      if (type.includes('.')) { return `, "${prop}" UNIQUEIDENTIFIER ${nullText}\n`; }
      if (type === 'boolean') { return `, "${prop}" BIT ${nullText}\n`; }
      if (type === 'date') { return `, "${prop}" DATE ${nullText}\n`; }
      if (type === 'datetime') { return `, "${prop}" DATE ${nullText}\n`; }

      if (type === 'number') {
        return `
        , "${prop}" MONEY ${nullText}
        , "${prop}.In" MONEY ${nullText}
        , "${prop}.Out" MONEY ${nullText}\n`;
      }

      return `, "${prop}" NVARCHAR(150)\n ${nullText}`;
    };

    let query = '';
    for (const register of RegisteredRegisterAccumulation) {
      const doc = createRegisterAccumulation(register.type, true, {});
      const props = doc.Props();
      let select = '';
      for (const prop in excludeRegisterAccumulatioProps(doc)) {
        select += simleProperty(prop, (props[prop].type || 'string'), !!props[prop].required);
      }

      query += `\n
      DROP TABLE "${register.type}";
      CREATE TABLE "${register.type}" (
        [kind] [bit] NULL,
        [company] [uniqueidentifier] NULL,
        [document] [uniqueidentifier] NOT NULL,
        [date] [date] NOT NULL
        ${select}
      );
      CREATE CLUSTERED COLUMNSTORE INDEX "cci.${register.type}" ON "${register.type}";\n`;
    }
    return query;
  }

  static CreateViewCatalogs() {

    let query = '';
    for (const catalog of RegisteredDocument) {
      const doc = createDocument(catalog.type);
      let select = SQLGenegator.QueryList(doc.Props(), doc.Prop() as DocumentOptions);
      const type = (doc.Prop() as DocumentOptions).type.split('.');
      const name = type.length === 2 ? type[1] : type[0];
      select = select.replace('FROM dbo\.\"Documents\" d', `

      ,COALESCE(
        (SELECT description from [dbo].[Documents] where [dbo].[Documents].id = d.[parent] ), d.description ) as "${name}.Level4"
      ,COALESCE(
        (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
          (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent])),
        COALESCE(
          (SELECT description from [dbo].[Documents] where [dbo].[Documents].id = d.[parent] ), d.description)) "${name}.Level3"
      ,COALESCE(
        (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
          (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id =
            (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent]))),
        COALESCE(
          (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
            (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent])),
          COALESCE(
            (SELECT description from [dbo].[Documents] where [dbo].[Documents].id = d.[parent] ), d.description))) "${name}.Level2"
      ,COALESCE(
        (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
          (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id =
            (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id =
              (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent])))),
        COALESCE(
          (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
            (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id =
             (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent]))),
        COALESCE(
          (SELECT description from [dbo].[Documents] where [dbo].[Documents].id =
            (SELECT [parent] from [dbo].[Documents] where [dbo].[Documents].id = d.[parent])),
        COALESCE(
          (SELECT description from [dbo].[Documents] where [dbo].[Documents].id = d.[parent] ), d.description)))) as "${name}.Level1"
      FROM dbo."Documents" d\n`).replace('d.description,', `d.description "${name}",`);

      query += `\n
      CREATE OR ALTER VIEW dbo."${catalog.type}" WITH SCHEMABINDING AS
        ${select}
      GO`;
    }
    return query;
  }
}

export function buildTypesQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      '${row.type}' "type",
      '${row.type}' code,
      N'${row.description}' description,
      1 posted,
      0 deleted,
      0 isfolder,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE (1=1) `;
  return query;
}

export function buildSubcountQueryList(select: { type: any; description: string; }[]) {
  let query = '';
  for (const row of select) {
    query += `SELECT
      '${row.type}' AS id,
      'Catalog.Subcount' "type",
      '${row.type}' code,
      N'${row.description}' description,
      1 posted,
      0 deleted,
      0 isfolder,
      NULL parent
      UNION ALL\n`;
  }
  query = `SELECT * FROM (${query.slice(0, -10)}) d WHERE (1=1) `;
  return query;
}

export function excludeProps(doc) {
  const { user, company, parent, info, isfolder, description, id, type, date, code, posted, deleted, timestamp, ...newObject } = doc;
  return newObject;
}

export function excludeRegisterAccumulatioProps(doc) {
  const { kind, date, type, company, data, document, ...newObject } = doc;
  return newObject;
}

export function excludeRegisterInfoProps(doc) {
  const { kind, date, type, company, data, document, ...newObject } = doc;
  return newObject;
}
