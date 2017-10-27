CREATE VIEW "Register.Account.View" AS SELECT r.document AS document_id,
    r.datetime AS date,
    document.description AS document,
    jsonb_build_object('account', dt.code, 'description', dt.description, 'subcount1', jsonb_build_object('id', dt_subcount1.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (dt_subcount1.type)::text)), 'value', dt_subcount1.description, 'type', dt_subcount1.type), 'subcount2', jsonb_build_object('id', dt_subcount2.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (dt_subcount2.type)::text)), 'value', dt_subcount2.description, 'type', dt_subcount2.type), 'subcount3', jsonb_build_object('id', dt_subcount3.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (dt_subcount3.type)::text)), 'value', dt_subcount3.description, 'type', dt_subcount3.type), 'subcount4', jsonb_build_object('id', dt_subcount4.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (dt_subcount4.type)::text)), 'value', dt_subcount3.description, 'type', dt_subcount4.type), 'qty', r.dt_qty, 'currency', dt_cur.description) AS debet,
    jsonb_build_object('account', kt.code, 'description', kt.description, 'subcount1', jsonb_build_object('id', kt_subcount1.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (kt_subcount1.type)::text)), 'value', kt_subcount1.description, 'type', kt_subcount1.type), 'subcount2', jsonb_build_object('id', kt_subcount2.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (kt_subcount2.type)::text)), 'value', kt_subcount2.description, 'type', kt_subcount2.type), 'subcount3', jsonb_build_object('id', kt_subcount3.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (kt_subcount3.type)::text)), 'value', kt_subcount3.description, 'type', kt_subcount3.type), 'subcount4', jsonb_build_object('id', kt_subcount4.id, 'code', ( SELECT config_schema.description
           FROM config_schema
          WHERE ((config_schema.type)::text = (kt_subcount4.type)::text)), 'value', kt_subcount3.description, 'type', kt_subcount4.type), 'qty', r.kt_qty, 'currency', kt_cur.description) AS kredit,
    ((r.sum)::text)::jsonb AS sum,
    company.description AS company
   FROM (((((((((((((("Register.Account" r
     LEFT JOIN "Documents" document ON (((document.id)::text = (r.document)::text)))
     LEFT JOIN "Documents" dt ON (((dt.id)::text = (r.dt)::text)))
     LEFT JOIN "Documents" kt ON (((kt.id)::text = (r.kt)::text)))
     LEFT JOIN "Documents" dt_subcount1 ON (((dt_subcount1.id)::text = (r.dt_subcount1)::text)))
     LEFT JOIN "Documents" dt_subcount2 ON (((dt_subcount2.id)::text = (r.dt_subcount2)::text)))
     LEFT JOIN "Documents" dt_subcount3 ON (((dt_subcount3.id)::text = (r.dt_subcount3)::text)))
     LEFT JOIN "Documents" dt_subcount4 ON (((dt_subcount4.id)::text = (r.dt_subcount4)::text)))
     LEFT JOIN "Documents" kt_subcount1 ON (((kt_subcount1.id)::text = (r.kt_subcount1)::text)))
     LEFT JOIN "Documents" kt_subcount2 ON (((kt_subcount2.id)::text = (r.kt_subcount2)::text)))
     LEFT JOIN "Documents" kt_subcount3 ON (((kt_subcount3.id)::text = (r.kt_subcount3)::text)))
     LEFT JOIN "Documents" kt_subcount4 ON (((kt_subcount4.id)::text = (r.kt_subcount4)::text)))
     LEFT JOIN "Documents" dt_cur ON (((dt_cur.id)::text = (r.dt_cur)::text)))
     LEFT JOIN "Documents" kt_cur ON (((kt_cur.id)::text = (r.kt_cur)::text)))
     LEFT JOIN "Documents" company ON (((company.id)::text = (r.company)::text)));

