ALTER TRIGGER "Accumulation.Delete" ON dbo."Accumulation"
FOR DELETE AS
BEGIN

  DECLARE @type NVARCHAR(100);
  DECLARE @document UNIQUEIDENTIFIER;
  DECLARE @query AS NVARCHAR(max);

  DECLARE types CURSOR FAST_FORWARD FOR SELECT distinct type, document from DELETED where type = 'Register.Accumulation.Sales';
  OPEN types;
	FETCH NEXT FROM types INTO @type, @document;
	WHILE (@@FETCH_STATUS = 0)
	BEGIN
    SET @query = N'
      DELETE FROM "' + @type + N'"
      WHERE document = @document';
    EXEC sp_executesql @query,  N'@document UNIQUEIDENTIFIER', @document = @document;
    FETCH NEXT FROM types INTO @type, @document;
  END;
  CLOSE types;
  DEALLOCATE types;
END;
GO;

ALTER TRIGGER "Accumulation.Insert" ON dbo."Accumulation"
FOR INSERT AS
BEGIN

  INSERT INTO "Register.Accumulation.Sales"
  (date, document, company, Department, Customer, Product, Manager, Amount, Cost, Qty, Tax)
  SELECT
    CAST(date AS DATE) date,
    document,
    company,
    CAST(JSON_VALUE(data, '$.Department') AS UNIQUEIDENTIFIER) Department,
    CAST(JSON_VALUE(data, '$.Customer') AS UNIQUEIDENTIFIER) Customer,
    CAST(JSON_VALUE(data, '$.Product') AS UNIQUEIDENTIFIER) Product,
    CAST(JSON_VALUE(data, '$.Manager') AS UNIQUEIDENTIFIER) Manager,
    CAST(JSON_VALUE(data, '$.Amount') AS NUMERIC(15, 2)) Amount,
    CAST(JSON_VALUE(data, '$.Qty') AS NUMERIC(15, 4)) Qty,
    CAST(JSON_VALUE(data, '$.Cost') AS NUMERIC(15, 4)) Cost,
    CAST(JSON_VALUE(data, '$.Tax') AS NUMERIC(15, 4)) Tax
  FROM INSERTED WHERE type = 'Register.Accumulation.Sales';

END;
GO;