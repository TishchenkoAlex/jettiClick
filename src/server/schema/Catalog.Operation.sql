SELECT
    d.id,
    d.type,
    d.date,
    d.code,
    d.description,
    d.posted,
    d.deleted,
    jsonb_build_object('id', "parent".id, 'value', "parent".description, 'type', 'Catalog.Operation', 'code', "parent".code) "parent",
    d.isfolder,
    d.info,
    d.doc->>'script' "script",
    d.doc->>'Prefix' "Prefix",
    jsonb_build_object('id', "group".id, 'value', "group".description, 'type', 'Catalog.Operation.Group', 'code', "group".code) "Group",
    jsonb_build_object('id', "company".id, 'value', "company".description, 'type', 'Catalog.Company', 'code', "company".code) "company",
    jsonb_build_object('id', "user".id, 'value', "user".description, 'type', 'Catalog.User', 'code', "user".code) "user",

    coalesce((SELECT replace(replace(jsonb_agg(j)::TEXT, '{"Rules":', ''), '}}', '}')::JSONB FROM (
        SELECT jsonb_build_object(
            'debet',  jsonb_build_object('id', "debet".id, 'value', "debet".description, 'type', "debet".type, 'code', "debet".code),
            'kredit', jsonb_build_object('id', "kredit".id, 'value', "kredit".description, 'type', kredit.type, 'code', "kredit".code),
            'd1', CASE WHEN "d1".id IS NULL AND d.doc -> 'd1' IS NOT NULL THEN d.doc -> 'd1' ELSE jsonb_build_object('id', "d1".id, 'value', "d1".description, 'type', coalesce("d1".type, 'Types.Subcount'), 'code', "d1".code) END,
            'd2', CASE WHEN "d2".id IS NULL AND d.doc -> 'd2' IS NOT NULL THEN d.doc -> 'd2' ELSE jsonb_build_object('id', "d2".id, 'value', "d2".description, 'type', coalesce("d2".type, 'Types.Subcount'), 'code', "d2".code) END,
            'k1', CASE WHEN "k1".id IS NULL AND d.doc -> 'k1' IS NOT NULL THEN d.doc -> 'k1' ELSE jsonb_build_object('id', "k1".id, 'value', "k1".description, 'type', coalesce("k1".type, 'Types.Subcount'), 'code', "k1".code) END,
            'k2', CASE WHEN "k2".id IS NULL AND d.doc -> 'k2' IS NOT NULL THEN d.doc -> 'k2' ELSE jsonb_build_object('id', "k2".id, 'value', "k2".description, 'type', coalesce("k2".type, 'Types.Subcount'), 'code', "k2".code) END
        ) "Rules"
        FROM
            "Documents" di,
            jsonb_to_recordset(d.doc->'Rules') as x ("debet" VARCHAR(36), "d1" VARCHAR(36), "d2" VARCHAR(36), "kredit" VARCHAR(36), "k1" VARCHAR(36), "k2" VARCHAR(36))
                LEFT JOIN "Documents" "debet" ON "debet".id = x."debet" AND "debet".type = 'Catalog.Account'
                LEFT JOIN "Documents" "kredit" ON "kredit".id = x."kredit" AND "kredit".type = 'Catalog.Account'
                LEFT JOIN "Documents" "d1" ON "d1".id = x."d1"
                LEFT JOIN "Documents" "d2" ON "d2".id = x."d2"
                LEFT JOIN "Documents" "k1" ON "k1".id = x."k1"
                LEFT JOIN "Documents" "k2" ON "k2".id = x."k2"
        WHERE di.id = d.id) j
    ), '[]') "Rules",

    coalesce((SELECT replace(replace(jsonb_agg(j)::TEXT, '{"Parameters":', ''), '}}', '}')::JSONB FROM (
        SELECT jsonb_build_object(
            'parameter', x."parameter",
            'label', x."label",
            'type', jsonb_build_object('id', "type".type, 'value', "type".description, 'type', 'Catalog.Subcount', 'code', "type".type),
            'order', x."order",
            'change', x."change",
            'tableDef', x."tableDef",
            'required', x."required"
        ) "Parameters"
        FROM
            "Documents" di,
            jsonb_to_recordset(d.doc->'Parameters') as x ("parameter" TEXT, "label" TEXT, "type" TEXT, "order" INTEGER, "change" TEXT, "tableDef" TEXT, "required" BOOLEAN)
            LEFT JOIN "config_schema" "type" ON "type".type = x."type"
        WHERE di.id = d.id) j
    ), '[]') "Parameters"
FROM
    "Documents" d
    LEFT JOIN "Documents" "company" ON "company".id = d.company AND "company".type = 'Catalog.Company'
    LEFT JOIN "Documents" "group" ON "group".id = d.doc->>'Group' AND "group".type = 'Catalog.Operation.Group'
    LEFT JOIN "Documents" "user" ON "user".id = d."user"AND "user".type = 'Catalog.User'
    LEFT JOIN "Documents" "parent" ON "parent".id = d."parent" AND "parent".type = 'Catalog.Operation'
WHERE d.type = 'Catalog.Operation';


--  
SELECT
    d.id,
    d.type,
    d.date,
    d.code,
    d.description,
    d.posted,
    d.deleted,
    d.parent,
    d.isfolder,
    d.doc ->> 'Prefix' "Prefix",
    "user".description "user",
    "company".description "company",
    "Operation.Group".description "Group"
FROM
    "Documents" d
LEFT JOIN "Documents" "company" ON "company".id = d.company AND "company".type = 'Catalog.Company'
LEFT JOIN "Documents" "user" ON "user".id = d."user" AND "user".type = 'Catalog.User'
LEFT JOIN "Documents" "Operation.Group" ON "Operation.Group".id =  d.doc->>'Group' AND "Operation.Group".type = 'Catalog.Operation.Group'
WHERE d.type = 'Catalog.Operation';

SELECT
    uuid_generate_v1mc() id,
    now() date,
    'Catalog.Operation' "type",
    '' code,
    '' description,
    false posted,
    false deleted,
    false isfolder,
    '' info,
    '' script,
    '' "Prefix",
    '' "category",
    '{"id": "", "code": "", "type": "Catalog.Operation", "value": ""}':: JSONB "parent",
    '{"id": "", "code": "", "type": "Catalog.User", "value": ""}':: JSONB "user",
    '{"id": "", "code": "", "type": "Catalog.Company", "value": ""}':: JSONB "company",
    '{"id": "", "code": "", "type": "Catalog.Operation.Group", "value": ""}':: JSONB "Group",
    '[]'::JSONB "Rules",
    '[]'::JSONB "Parameters";
