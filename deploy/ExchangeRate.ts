const lib: any = null;
const doc: any = null;
const tx: any = null;
const Registers: any = null;
/////////////////

const balanceCurrency = doc.currency;

const Expense = lib.doc.byCode('Catalog.Expense', 'EXCH.LOSS', tx);
const Income = lib.doc.byCode('Catalog.Income', 'EXCH.PROFIT', tx);

const BalanceEMPLOYEE = lib.doc.byCode('Catalog.Balance', 'EMPLOYEE', tx);
const BalancePL = lib.doc.byCode('Catalog.Balance', 'PL', tx);
const BalanceLOAN = lib.doc.byCode('Catalog.Balance', 'LOAN', tx);

const AnaliticsExpenseLOAN = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.LOAN', tx);
const AnaliticsExpensePERS = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.PERS', tx);
const AnaliticsExpenseAP = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AP', tx);
const AnaliticsExpenseAR = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AR', tx);
const AnaliticsExpenseCASH = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.CASH', tx);
const AnaliticsExpenseBANK = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.BANK', tx);

const endOfMonth = doc.date;

let totalDiff = 0;

const LOAN = async () => {
    const queryText = `
    SELECT
      JSON_VALUE(r.data, N'$.Loan') "Loan",
      currency.id "currency",
      JSON_VALUE(r.data, N'$.Counterpartie') "Counterpartie",
      SUM(CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
      SUM(CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
        JOIN "Documents" "Loan" ON "Loan".id = JSON_VALUE(data, N'$.Loan')
        JOIN "Documents" "currency" ON currency.id = JSON_VALUE("Loan".doc, N'$.currency') AND currency.id <> @p3
    WHERE
        r.type = N'Register.Accumulation.Loan' AND
        r.company = @p1 AND
        r.date <= @p2
    GROUP BY
        JSON_VALUE(r.data, N'$.Loan'),
        JSON_VALUE(r.data, N'$.Counterpartie'),
        currency.id `;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        const LoanObject = lib.doc.byId(row.Loan);
        const Department = LoanObject ? LoanObject.Department : null;
        totalDiff += difference;

        // Loan
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Loan',
            data: {
                Loan: row.Loan,
                Counterpartie: row.Counterpartie,
                Amount: 0,
                AmountInBalance: difference < 0 ? -difference : difference
            }
        });

        // PL
        Registers.Accumulation.push({
            kind: true,
            type: 'Register.Accumulation.PL',
            data: {
                Department: Department,
                PL: difference < 0 ? Expense : Income,
                Analytics: AnaliticsExpenseLOAN,
                Amount: difference < 0 ? -difference : difference
            }
        });

        // Balance
        Registers.Accumulation.push({
            kind: difference < 0 ? true : false,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: BalancePL,
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: BalanceLOAN,
                Analytics: row.Counterpartie,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const PERS = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(r.data, '$.CashFlow') AS UNIQUEIDENTIFIER) "CashFlow",
        CAST(JSON_VALUE(r.data, '$.Employee') AS UNIQUEIDENTIFIER) "Employee",
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) "currency",
        SUM(CAST(JSON_VALUE(data, '$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, '$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
    WHERE
        r.type = 'Register.Accumulation.AccountablePersons' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        CAST(JSON_VALUE(r.data, '$.CashFlow') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.Employee') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER)`;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        const Department = doc.Подразделение;
        totalDiff += difference;

        // AccountablePersons
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.AccountablePersons',
            data: {
                CashFlow: row.CashFlow,
                Employee: row.Employee,
                Amount: 0,
                currency: balanceCurrency,
                AmountInBalance: difference < 0 ? -difference : difference
            }
        });

        // PL
        Registers.Accumulation.push({
            kind: true,
            type: 'Register.Accumulation.PL',
            data: {
                Department: Department,
                PL: difference < 0 ? Expense : Income,
                Analytics: AnaliticsExpensePERS,
                Amount: difference < 0 ? -difference : difference
            }
        });

        // Balance
        Registers.Accumulation.push({
            kind: difference < 0 ? true : false,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: BalancePL,
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: BalanceEMPLOYEE,
                Analytics: row.Employee,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};
