ALTER TRIGGER "Accumulation.Delete" ON dbo."Accumulation"
FOR DELETE AS
BEGIN

  DECLARE @type NVARCHAR(100);
  DECLARE @document UNIQUEIDENTIFIER;
  DECLARE @query AS NVARCHAR(max);

  DECLARE types CURSOR FAST_FORWARD FOR SELECT distinct type, document
  from DELETED
  where type = 'Register.Accumulation.Sales';
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
  FROM INSERTED
  WHERE type = 'Register.Accumulation.Sales';

END;
GO;

ALTER TRIGGER [dbo].[Accumulation.DELETE] ON [dbo].[Accumulation]
WITH NATIVE_COMPILATION, SCHEMABINDING
AFTER DELETE AS 
BEGIN ATOMIC WITH (TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')

DECLARE @id UNIQUEIDENTIFIER;
SELECT @id = del.document FROM DELETED del;

DELETE FROM dbo."Register.Accumulation.AccountablePersons" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.AP" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.AR" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Balance" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Bank" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Cash" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Cash.Transit" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Inventory" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Loan" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.PL" WHERE document = @id;
DELETE FROM dbo."Register.Accumulation.Sales" WHERE document = @id;

END;
GO;

ALTER TRIGGER [dbo].[Accumulation.INSERT] ON [dbo].[Accumulation]
WITH NATIVE_COMPILATION, SCHEMABINDING
AFTER INSERT AS 
BEGIN ATOMIC WITH(TRANSACTION ISOLATION LEVEL = SNAPSHOT, LANGUAGE = N'us_english')
INSERT INTO dbo."Register.Accumulation.AccountablePersons"
(date, document, company, kind , "currency"
, "Employee"
, "CashFlow"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."currency"') AS UNIQUEIDENTIFIER) "currency"
, CAST(JSON_VALUE(data, N'$."Employee"') AS UNIQUEIDENTIFIER) "Employee"
, CAST(JSON_VALUE(data, N'$."CashFlow"') AS UNIQUEIDENTIFIER) "CashFlow"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.AccountablePersons';

INSERT INTO dbo."Register.Accumulation.AP"
(date, document, company, kind , "currency"
, "Department"
, "AO"
, "Supplier"
, "PayDay"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."currency"') AS UNIQUEIDENTIFIER) "currency"
, CAST(JSON_VALUE(data, N'$."Department"') AS UNIQUEIDENTIFIER) "Department"
, CAST(JSON_VALUE(data, N'$."AO"') AS UNIQUEIDENTIFIER) "AO"
, CAST(JSON_VALUE(data, N'$."Supplier"') AS UNIQUEIDENTIFIER) "Supplier"
, JSON_VALUE(data, '$.PayDay') "PayDay"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.AP';

INSERT INTO dbo."Register.Accumulation.AR"
(date, document, company, kind , "currency"
, "Department"
, "AO"
, "Customer"
, "PayDay"
, "AR"
, "AR.In"
, "AR.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."currency"') AS UNIQUEIDENTIFIER) "currency"
, CAST(JSON_VALUE(data, N'$."Department"') AS UNIQUEIDENTIFIER) "Department"
, CAST(JSON_VALUE(data, N'$."AO"') AS UNIQUEIDENTIFIER) "AO"
, CAST(JSON_VALUE(data, N'$."Customer"') AS UNIQUEIDENTIFIER) "Customer"
, JSON_VALUE(data, '$.PayDay') "PayDay"

, CAST(JSON_VALUE(data, N'$.AR') AS MONEY) * IIF(kind = 1, 1, -1) "AR"
, CAST(JSON_VALUE(data, N'$.AR') AS MONEY) * IIF(kind = 1, 1, NULL) "AR.In"
, CAST(JSON_VALUE(data, N'$.AR') AS MONEY) * IIF(kind = 1, NULL, 1) "AR.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.AR';

INSERT INTO dbo."Register.Accumulation.Bank"
(date, document, company, kind , "BankAccount"
, "CashFlow"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."BankAccount"') AS UNIQUEIDENTIFIER) "BankAccount"
, CAST(JSON_VALUE(data, N'$."CashFlow"') AS UNIQUEIDENTIFIER) "CashFlow"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Bank';

INSERT INTO dbo."Register.Accumulation.Balance"
(date, document, company, kind , "Department"
, "Balance"
, "Analytics"
, "Amount"
, "Amount.In"
, "Amount.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."Department"') AS UNIQUEIDENTIFIER) "Department"
, CAST(JSON_VALUE(data, N'$."Balance"') AS UNIQUEIDENTIFIER) "Balance"
, CAST(JSON_VALUE(data, N'$."Analytics"') AS UNIQUEIDENTIFIER) "Analytics"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Balance';

INSERT INTO dbo."Register.Accumulation.Cash"
(date, document, company, kind , "CashRegister"
, "CashFlow"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."CashRegister"') AS UNIQUEIDENTIFIER) "CashRegister"
, CAST(JSON_VALUE(data, N'$."CashFlow"') AS UNIQUEIDENTIFIER) "CashFlow"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Cash';

INSERT INTO dbo."Register.Accumulation.Cash.Transit"
(date, document, company, kind , "currency"
, "Sender"
, "Recipient"
, "CashFlow"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."currency"') AS UNIQUEIDENTIFIER) "currency"
, CAST(JSON_VALUE(data, N'$."Sender"') AS UNIQUEIDENTIFIER) "Sender"
, CAST(JSON_VALUE(data, N'$."Recipient"') AS UNIQUEIDENTIFIER) "Recipient"
, CAST(JSON_VALUE(data, N'$."CashFlow"') AS UNIQUEIDENTIFIER) "CashFlow"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Cash.Transit';

INSERT INTO dbo."Register.Accumulation.Inventory"
(date, document, company, kind , "Expense"
, "Storehouse"
, "SKU"
, "batch"
, "Cost"
, "Cost.In"
, "Cost.Out"
, "Qty"
, "Qty.In"
, "Qty.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."Expense"') AS UNIQUEIDENTIFIER) "Expense"
, CAST(JSON_VALUE(data, N'$."Storehouse"') AS UNIQUEIDENTIFIER) "Storehouse"
, CAST(JSON_VALUE(data, N'$."SKU"') AS UNIQUEIDENTIFIER) "SKU"
, CAST(JSON_VALUE(data, N'$."batch"') AS UNIQUEIDENTIFIER) "batch"
, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, 1, -1) "Cost"
, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, 1, NULL) "Cost.In"
, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, NULL, 1) "Cost.Out"

, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, 1, -1) "Qty"
, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, 1, NULL) "Qty.In"
, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, NULL, 1) "Qty.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Inventory';

INSERT INTO dbo."Register.Accumulation.Loan"
(date, document, company, kind , "Loan"
, "Counterpartie"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "AmountInBalance"
, "AmountInBalance.In"
, "AmountInBalance.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."Loan"') AS UNIQUEIDENTIFIER) "Loan"
, CAST(JSON_VALUE(data, N'$."Counterpartie"') AS UNIQUEIDENTIFIER) "Counterpartie"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInBalance"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInBalance.In"
, CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInBalance.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Loan';

INSERT INTO dbo."Register.Accumulation.PL"
(date, document, company, kind , "Department"
, "PL"
, "Analytics"
, "Amount"
, "Amount.In"
, "Amount.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."Department"') AS UNIQUEIDENTIFIER) "Department"
, CAST(JSON_VALUE(data, N'$."PL"') AS UNIQUEIDENTIFIER) "PL"
, CAST(JSON_VALUE(data, N'$."Analytics"') AS UNIQUEIDENTIFIER) "Analytics"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.PL';

INSERT INTO dbo."Register.Accumulation.Sales"
(date, document, company, kind , "currency"
, "Department"
, "Customer"
, "Product"
, "Manager"
, "AO"
, "Storehouse"
, "Cost"
, "Cost.In"
, "Cost.Out"
, "Qty"
, "Qty.In"
, "Qty.Out"
, "Amount"
, "Amount.In"
, "Amount.Out"
, "Discount"
, "Discount.In"
, "Discount.Out"
, "Tax"
, "Tax.In"
, "Tax.Out"
, "AmountInDoc"
, "AmountInDoc.In"
, "AmountInDoc.Out"
, "AmountInAR"
, "AmountInAR.In"
, "AmountInAR.Out"
)
SELECT
  CAST(date AS DATE) date,
  document,
  company,
  kind
, CAST(JSON_VALUE(data, N'$."currency"') AS UNIQUEIDENTIFIER) "currency"
, CAST(JSON_VALUE(data, N'$."Department"') AS UNIQUEIDENTIFIER) "Department"
, CAST(JSON_VALUE(data, N'$."Customer"') AS UNIQUEIDENTIFIER) "Customer"
, CAST(JSON_VALUE(data, N'$."Product"') AS UNIQUEIDENTIFIER) "Product"
, CAST(JSON_VALUE(data, N'$."Manager"') AS UNIQUEIDENTIFIER) "Manager"
, CAST(JSON_VALUE(data, N'$."AO"') AS UNIQUEIDENTIFIER) "AO"
, CAST(JSON_VALUE(data, N'$."Storehouse"') AS UNIQUEIDENTIFIER) "Storehouse"

, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, 1, -1) "Cost"
, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, 1, NULL) "Cost.In"
, CAST(JSON_VALUE(data, N'$.Cost') AS MONEY) * IIF(kind = 1, NULL, 1) "Cost.Out"

, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, 1, -1) "Qty"
, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, 1, NULL) "Qty.In"
, CAST(JSON_VALUE(data, N'$.Qty') AS MONEY) * IIF(kind = 1, NULL, 1) "Qty.Out"

, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, -1) "Amount"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, 1, NULL) "Amount.In"
, CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * IIF(kind = 1, NULL, 1) "Amount.Out"

, CAST(JSON_VALUE(data, N'$.Discount') AS MONEY) * IIF(kind = 1, 1, -1) "Discount"
, CAST(JSON_VALUE(data, N'$.Discount') AS MONEY) * IIF(kind = 1, 1, NULL) "Discount.In"
, CAST(JSON_VALUE(data, N'$.Discount') AS MONEY) * IIF(kind = 1, NULL, 1) "Discount.Out"

, CAST(JSON_VALUE(data, N'$.Tax') AS MONEY) * IIF(kind = 1, 1, -1) "Tax"
, CAST(JSON_VALUE(data, N'$.Tax') AS MONEY) * IIF(kind = 1, 1, NULL) "Tax.In"
, CAST(JSON_VALUE(data, N'$.Tax') AS MONEY) * IIF(kind = 1, NULL, 1) "Tax.Out"

, CAST(JSON_VALUE(data, N'$.AmountInDoc') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInDoc"
, CAST(JSON_VALUE(data, N'$.AmountInDoc') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInDoc.In"
, CAST(JSON_VALUE(data, N'$.AmountInDoc') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInDoc.Out"

, CAST(JSON_VALUE(data, N'$.AmountInAR') AS MONEY) * IIF(kind = 1, 1, -1) "AmountInAR"
, CAST(JSON_VALUE(data, N'$.AmountInAR') AS MONEY) * IIF(kind = 1, 1, NULL) "AmountInAR.In"
, CAST(JSON_VALUE(data, N'$.AmountInAR') AS MONEY) * IIF(kind = 1, NULL, 1) "AmountInAR.Out"

FROM INSERTED WHERE type = N'Register.Accumulation.Sales';

END;
GO;
