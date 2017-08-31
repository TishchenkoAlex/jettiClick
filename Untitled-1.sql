SELECT to_jsonb(R) doc FROM (
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
    jsonb_build_object('id', Customer.id, 'value', Customer.description, 'type', 'Catalog.Counterparties', 'code', Customer.code) "Customer",
    jsonb_build_object('id', Manager.id, 'value', Manager.description, 'type', 'Catalog.Managers', 'code', Manager.code) "Manager",
    (d.doc ->> 'Tax')::DECIMAL "Tax",
    (d.doc ->> 'Amount')::DECIMAL "Amount",
    d.doc ->> 'Status' "Status",
    (SELECT replace(replace(jsonb_agg(j)::TEXT, '{"Items":', ''), '}}', '}')::JSONB FROM (
        SELECT jsonb_build_object('Qty', x."Qty", 'Price', x."Price",
            'SKU', jsonb_build_object('id', SKU.id, 'value', SKU.description, 'type', 'Catalog.Products', 'code', SKU.code)) "Items"
        FROM
            "Documents" di,
            jsonb_to_recordset(d.doc->'Items') as x ("Qty" NUMERIC, "SKU" VARCHAR(36), "Price" NUMERIC)
                LEFT JOIN "Documents" SKU ON SKU.id = x."SKU"
        WHERE di.id = d.id) j) "Items",

    (SELECT replace(replace(jsonb_agg(j)::TEXT, '{"Comments":', ''), '}}', '}')::JSONB FROM (
        SELECT jsonb_build_object('Qty', x."Qty", 'Price', x."Price",
            'SKU', jsonb_build_object('id', SKU.id, 'value', SKU.description, 'type', 'Catalog.Products', 'code', SKU.code)) "Comments"
        FROM
            "Documents" di,
            jsonb_to_recordset(d.doc->'Comments') as x ("Date" TIMESTAMP(0) WITHOUT TIME ZONE, "User" VARCHAR(36), "Comment" TEXT)
                LEFT JOIN "Documents" SKU ON SKU.id = x."SKU"
        WHERE di.id = d.id) j) "Comments"
FROM
    "Documents" d
    LEFT JOIN "Documents" Customer ON Customer.id = d.doc ->> 'Customer'
    LEFT JOIN "Documents" Manager ON Manager.id = d.doc ->> 'Manager'

WHERE
    d.id = ${1}
) R