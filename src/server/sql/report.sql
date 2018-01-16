WITH vars as (SELECT
  '2017-03-01'::DATE as SDate,
  '2017-06-30'::DATE + interval '1' day as EDate,
  'Customer'::TEXT as Dimension,
  'Catalog.Counterpartie'::TEXT AS DimensionType,
  'AR'::TEXT as Measure,
  'Register.Accumulation.AR'::TEXT as Register)
SELECT
    fin."Id" AS "Id",
    "Dimension".description as "Dimension",
    SUM(BeginBalance)::NUMERIC(15,2) "Begin",
    SUM(Income)::NUMERIC(15,2) "In",
    SUM(Expense)::NUMERIC(15,2) "Out",
    (coalesce(SUM(Income), 0)-coalesce(SUM(Expense), 0)+coalesce(SUM(BeginBalance), 0))::NUMERIC(15,2)  "End"
FROM (
  SELECT
      r.data ->> (SELECT Dimension FROM vars) AS "Id",
      SUM((r.data ->> (SELECT Measure FROM vars))::NUMERIC * CASE WHEN r."kind" THEN 1 ELSE NULL END) as Income,
      SUM((r.data ->> (SELECT Measure FROM vars))::NUMERIC * CASE WHEN r."kind" THEN NULL ELSE 1 END) as Expense,
      NULL as BeginBalance
  FROM "Register.Accumulation" r
  WHERE
      r.type = (SELECT Register FROM vars) 
      AND r.date >= (SELECT SDate FROM vars) AND r.date < (SELECT EDate FROM vars)
  GROUP BY r.data ->> (SELECT Dimension FROM vars)
  UNION ALL
  SELECT
      r.data ->> (SELECT Dimension FROM vars),
      NULL,
      NULL,
      SUM((r.data ->> (SELECT Measure FROM vars))::NUMERIC * CASE WHEN r."kind" THEN 1 ELSE -1 END)
  FROM "Register.Accumulation" r
  WHERE
      r.type = (SELECT Register FROM vars)
      AND r.date < (SELECT SDate FROM vars)
  GROUP BY r.data ->> (SELECT Dimension FROM vars)) fin
LEFT JOIN "Documents" "Dimension" ON "Dimension".id = fin."Id" AND "Dimension".type = (SELECT DimensionType FROM vars)
GROUP BY fin."Id", "Dimension".description;