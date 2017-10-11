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
    d.doc->>'script' "script",
    jsonb_build_object('id', "company".id, 'value', "company".description, 'type', 'Catalog.Company', 'code', "company".code) "company",
    jsonb_build_object('id', "user".id, 'value', "user".description, 'type', 'Catalog.User', 'code', "user".code) "user",

    coalesce((SELECT replace(replace(jsonb_agg(j)::TEXT, '{"Rules":', ''), '}}', '}')::JSONB FROM (
        SELECT jsonb_build_object(
            'debet',  jsonb_build_object('id', "debet".id, 'value', "debet".description, 'type', "debet".type, 'code', "debet".code),
            'kredit', jsonb_build_object('id', "kredit".id, 'value', "kredit".description, 'type', kredit.type, 'code', "kredit".code),
            'd1',     jsonb_build_object('id', "d1".id, 'value', "d1".description, 'type', coalesce("d1".type, 'Types.Subcount'), 'code', "d1".code),
            'd2',     jsonb_build_object('id', "d2".id, 'value', "d2".description, 'type', coalesce("d2".type, 'Types.Subcount'), 'code', "d2".code),
            'k1',     jsonb_build_object('id', "k1".id, 'value', "k1".description, 'type', coalesce("k1".type, 'Types.Subcount'), 'code', "k1".code),
            'k2',     jsonb_build_object('id', "k2".id, 'value', "k2".description, 'type', coalesce("k2".type, 'Types.Subcount'), 'code', "k2".code)
        ) "Rules"
        FROM
            "Documents" di,
            jsonb_to_recordset(d.doc->'Rules') as x ("debet" VARCHAR(36), "d1" VARCHAR(36), "d2" VARCHAR(36), "kredit" VARCHAR(36), "k1" VARCHAR(36), "k2" VARCHAR(36))
                LEFT JOIN "Documents" "debet" ON "debet".id = x."debet"
                LEFT JOIN "Documents" "kredit" ON "kredit".id = x."kredit"
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
    LEFT JOIN "Documents" "company" ON "company".id = d.company
    LEFT JOIN "Documents" "user" ON "user".id = d."user"
WHERE d.type = 'Catalog.Operation'