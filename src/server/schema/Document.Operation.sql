SELECT
    d.id,
    d.type,
    d.date,
    d.code,
    d.description,
    d.posted,
    d.deleted,
    jsonb_build_object('id', "parent".id, 'value', "parent".description, 'type', 'Document.Operation', 'code', "parent".code) "parent",
    d.isfolder,
    d.info,
    jsonb_build_object('id', "company".id, 'value', "company".description, 'type', 'Catalog.Company', 'code', "company".code) "company",
    jsonb_build_object('id', "user".id, 'value', "user".description, 'type', 'Catalog.User', 'code', "user".code) "user",
    jsonb_build_object('id', "Operation".id, 'value', "Operation".description, 'type', 'Catalog.Operation', 'code', "Operation".code) "Operation",
    jsonb_build_object('id', "Operation.Group".id, 'value', "Operation.Group".description, 'type', 'Catalog.Operation.Group', 'code', "Operation.Group".code) "Group",
    jsonb_build_object('id', "Currency".id, 'value', "Currency".description, 'type', 'Catalog.Currency', 'code', "Currency".code) "currency",
    CASE WHEN "p1".id IS NULL THEN d.doc -> 'p1' ELSE jsonb_build_object('id', "p1".id, 'value', "p1".description, 'type', "p1".type, 'code', "p1".code) END "p1",
    CASE WHEN "p2".id IS NULL THEN d.doc -> 'p2' ELSE jsonb_build_object('id', "p2".id, 'value', "p2".description, 'type', "p2".type, 'code', "p2".code) END "p2",
    CASE WHEN "p3".id IS NULL THEN d.doc -> 'p3' ELSE jsonb_build_object('id', "p3".id, 'value', "p3".description, 'type', "p3".type, 'code', "p3".code) END "p3",
    CASE WHEN "p4".id IS NULL THEN d.doc -> 'p4' ELSE jsonb_build_object('id', "p4".id, 'value', "p4".description, 'type', "p4".type, 'code', "p4".code) END "p4",
    CASE WHEN "p5".id IS NULL THEN d.doc -> 'p5' ELSE jsonb_build_object('id', "p5".id, 'value', "p5".description, 'type', "p5".type, 'code', "p5".code) END "p5",
    CASE WHEN "p6".id IS NULL THEN d.doc -> 'p6' ELSE jsonb_build_object('id', "p6".id, 'value', "p6".description, 'type', "p6".type, 'code', "p6".code) END "p6",
    CASE WHEN "p7".id IS NULL THEN d.doc -> 'p7' ELSE jsonb_build_object('id', "p7".id, 'value', "p7".description, 'type', "p7".type, 'code', "p7".code) END "p7",
    CASE WHEN "p8".id IS NULL THEN d.doc -> 'p8' ELSE jsonb_build_object('id', "p8".id, 'value', "p8".description, 'type', "p8".type, 'code', "p8".code) END "p8",
    CASE WHEN "p9".id IS NULL THEN d.doc -> 'p9' ELSE jsonb_build_object('id', "p9".id, 'value', "p9".description, 'type', "p9".type, 'code', "p9".code) END "p9",
    d.doc -> 'Amount' "Amount"
FROM
    "Documents" d
    LEFT JOIN "Documents" "company" ON "company".id = d.company
    LEFT JOIN "Documents" "user" ON "user".id = d."user"
    LEFT JOIN "Documents" "Operation" ON "Operation".id = d.doc ->> 'Operation' AND "Operation".type = 'Catalog.Operation'
    LEFT JOIN "Documents" "Currency" ON "Currency".id = d.doc ->> 'currency' AND "Currency".type = 'Catalog.Currency'
    LEFT JOIN "Documents" "p1" ON "p1".id = d.doc ->> 'p1'
    LEFT JOIN "Documents" "p2" ON "p2".id = d.doc ->> 'p2'
    LEFT JOIN "Documents" "p3" ON "p3".id = d.doc ->> 'p3'
    LEFT JOIN "Documents" "p4" ON "p4".id = d.doc ->> 'p4'
    LEFT JOIN "Documents" "p5" ON "p5".id = d.doc ->> 'p5'
    LEFT JOIN "Documents" "p6" ON "p6".id = d.doc ->> 'p6'
    LEFT JOIN "Documents" "p7" ON "p7".id = d.doc ->> 'p7'
    LEFT JOIN "Documents" "p8" ON "p8".id = d.doc ->> 'p8'
    LEFT JOIN "Documents" "p9" ON "p9".id = d.doc ->> 'p9'
    LEFT JOIN "Documents" "parent" ON "parent".id = d.parent AND "parent".type = 'Document.Operation'
    LEFT JOIN "Documents" "Operation.Group" ON "Operation.Group".id = "Operation".doc->>'Group' AND "Operation.Group".type = 'Catalog.Operation.Group'
WHERE d.type = 'Document.Operation';


----
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
    "user".description "user",
    "company".description "company",
    "Operation".description "Operation",
    "Currency".description "currency",
    "p1".description "column1",
    "p2".description "column2",
    "p3".description "column3",
    "Operation.Group".description "Group",
    (d.doc ->> 'Amount')::NUMERIC(15, 2) "Amount"
FROM
    "Documents" d
LEFT JOIN "Documents" "company" ON "company".id = d.company AND "company".type = 'Catalog.Company'
LEFT JOIN "Documents" "user" ON "user".id = d."user" AND "user".type = 'Catalog.User'
LEFT JOIN "Documents" "Currency" ON "Currency".id = d.doc ->> 'currency' AND "Currency".type = 'Catalog.Currency'
LEFT JOIN "Documents" "Operation" ON "Operation".id = d.doc ->> 'Operation' AND "Operation".type = 'Catalog.Operation'
LEFT JOIN "Documents" "Operation.Group" ON "Operation.Group".id = "Operation".doc->>'Group' AND "Operation.Group".type = 'Catalog.Operation.Group'
LEFT JOIN "Documents" "p1" ON "p1".id = d.doc ->> 'p1'
LEFT JOIN "Documents" "p2" ON "p2".id = d.doc ->> 'p2'
LEFT JOIN "Documents" "p3" ON "p3".id = d.doc ->> 'p3'
WHERE d.type = 'Document.Operation';

--- 
SELECT
    uuid_generate_v1mc() id,
    now() date,
    'Document.Operation' "type",
    '' code,
    (SELECT description from config_schema where type = 'Document.Operation') || ' ...' description,
    false posted,
    false deleted,
    '{"id": "", "code": "", "type": "Document.Operation", "value": ""}':: JSONB "parent",
    '{"id": "", "code": "", "type": "Catalog.Operation.Group", "value": ""}':: JSONB "Group",
    false isfolder,
    '' info,
    '{"id": "", "code": "", "type": "Catalog.Operation", "value": ""}':: JSONB "Operation",
    '{"id": "", "code": "", "type": "Catalog.User", "value": ""}':: JSONB "user",
    '{"id": "", "code": "", "type": "Catalog.Company", "value": ""}':: JSONB "company",
    '{"id": "", "code": "", "type": "Catalog.Currency", "value": ""}':: JSONB "currency",
    0 "Amount"