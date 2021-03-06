// tslint:disable:max-line-length
const lib: any = null;
const doc: any = null;
const tx: any = null;
const Registers: any = null;
/////////////////

const balanceCurrency = doc.currency;

const Expense = lib.doc.byCode('Catalog.Expense', 'EXCH.LOSS', tx);
const Income = lib.doc.byCode('Catalog.Income', 'EXCH.PROFIT', tx);

const AnaliticsExpenseLOAN = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.LOAN', tx);
const AnaliticsExpensePERS = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.PERS', tx);
const AnaliticsExpenseAP = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AP', tx);
const AnaliticsExpenseAR = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AR', tx);
const AnaliticsExpenseCASH = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.CASH', tx);
const AnaliticsExpenseBANK = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.BANK', tx);

const CashFlowSALARY = lib.doc.byCode('Catalog.CashFlow', 'SALARY', tx);

const BalanceEMPLOYEE = lib.doc.byCode('Catalog.Balance', 'EMPLOYEE', tx);
const BalanceSALARY = lib.doc.byCode('Catalog.Balance', 'SALARY', tx);
const BalancePL = lib.doc.byCode('Catalog.Balance', 'PL', tx);
const BalanceLOAN = lib.doc.byCode('Catalog.Balance', 'LOAN', tx);
const BalanceAP = lib.doc.byCode('Catalog.Balance', 'AP', tx);
const BalanceAR = lib.doc.byCode('Catalog.Balance', 'AR', tx);
const BalanceCASH = lib.doc.byCode('Catalog.Balance', 'CASH', tx);
const BalanceBANK = lib.doc.byCode('Catalog.Balance', 'BANK', tx);

const endOfMonth = doc.date;

let totalDiff = 0;

const LOAN = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(r.data, N'$.Loan') AS UNIQUEIDENTIFIER) "Loan",
        JSON_VALUE(r.data, N'$.Counterpartie') "Counterpartie",
        CAST(JSON_VALUE("Loan".doc, N'$.currency') AS UNIQUEIDENTIFIER) "currency",
        CAST(JSON_VALUE("Loan".doc, N'$.Department') AS UNIQUEIDENTIFIER) "Department",
        SUM(CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
        JOIN "Documents" "Loan" ON "Loan".id = CAST(JSON_VALUE(data, N'$.Loan') AS UNIQUEIDENTIFIER)
    WHERE
        r.type = N'Register.Accumulation.Loan' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE("Loan".doc, N'$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        JSON_VALUE(r.data, N'$.Loan'),
        JSON_VALUE(r.data, N'$.Counterpartie'),
        CAST(JSON_VALUE("Loan".doc, N'$.currency') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE("Loan".doc, N'$.Department') AS UNIQUEIDENTIFIER) `;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        if (Math.round(difference * 100) / 100 === 0) continue;
        totalDiff += difference;

        // Loan
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Loan',
            data: {
                Loan: row.Loan,
                Counterpartie: row.Counterpartie,
                currency: row.currency,
                Amount: 0,
                AmountInBalance: difference < 0 ? -difference : difference
            }
        });

        // PL
        Registers.Accumulation.push({
            kind: true,
            type: 'Register.Accumulation.PL',
            data: {
                Department: row.Department,
                PL: difference < 0 ? Expense : Income,
                Analytics: AnaliticsExpenseLOAN,
                Amount: -difference
            }
        });

        // Balance
        Registers.Accumulation.push({
            kind: difference < 0 ? true : false,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
                Balance: BalancePL,
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
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
        if (Math.round(difference * 100) / 100 === 0) continue;
        const Department = doc.Подразделение;
        totalDiff += difference;

        // AccountablePersons
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.AccountablePersons',
            data: {
                CashFlow: row.CashFlow,
                Employee: row.Employee,
                currency: row.currency,
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
                Analytics: AnaliticsExpensePERS,
                Amount: -difference
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
                Balance: row.CashFlow === CashFlowSALARY ? BalanceSALARY : BalanceEMPLOYEE,
                Analytics: row.Employee,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const AP = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(r.data, '$.Department') AS UNIQUEIDENTIFIER) "Department",
        CAST(JSON_VALUE(r.data, '$.Supplier') AS UNIQUEIDENTIFIER) "Supplier",
        CAST(JSON_VALUE(r.data, '$.AO') AS UNIQUEIDENTIFIER) "AO",
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) "currency",
        SUM(CAST(JSON_VALUE(data, '$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, '$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
    WHERE
        r.type = 'Register.Accumulation.AP' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        CAST(JSON_VALUE(r.data, '$.Department') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.Supplier') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.AO') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER)`;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        if (Math.round(difference * 100) / 100 === 0) continue;
        const Department = row.Department;
        totalDiff += difference;

        // AccountablePersons
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.AP',
            data: {
                Department: row.Department,
                AO: row.AO,
                Supplier: row.Supplier,
                currency: row.currency,
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
                Analytics: AnaliticsExpenseAP,
                Amount: -difference
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
                Balance: BalanceAP,
                Analytics: row.Supplier,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const AR = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(r.data, '$.Department') AS UNIQUEIDENTIFIER) "Department",
        CAST(JSON_VALUE(r.data, '$.Customer') AS UNIQUEIDENTIFIER) "Customer",
        CAST(JSON_VALUE(r.data, '$.AO') AS UNIQUEIDENTIFIER) "AO",
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) "currency",
        SUM(CAST(JSON_VALUE(data, '$.AR') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, '$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
    WHERE
        r.type = 'Register.Accumulation.AR' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        CAST(JSON_VALUE(r.data, '$.Department') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.Customer') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.AO') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, '$.currency') AS UNIQUEIDENTIFIER)`;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        if (Math.round(difference * 100) / 100 === 0) continue;
        const Department = row.Department;
        totalDiff += difference;

        // AR
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.AR',
            data: {
                Department: row.Department,
                AO: row.AO,
                Customer: row.Customer,
                currency: row.currency,
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
                Analytics: AnaliticsExpenseAR,
                Amount: -difference
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
                Balance: BalanceAR,
                Analytics: row.Customer,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const CASH = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(data, N'$.CashRegister') AS UNIQUEIDENTIFIER) "CashRegister",
        CAST(JSON_VALUE(r.data, N'$.CashFlow') AS UNIQUEIDENTIFIER) "CashFlow",
        CAST(JSON_VALUE("CashRegister".doc, N'$.currency') AS UNIQUEIDENTIFIER) "currency",
        CAST(JSON_VALUE("CashRegister".doc, N'$.Department') AS UNIQUEIDENTIFIER) "Department",
        SUM(CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
        JOIN "Documents" "CashRegister" ON "CashRegister".id = CAST(JSON_VALUE(data, N'$.CashRegister') AS UNIQUEIDENTIFIER)
    WHERE
        r.type = N'Register.Accumulation.Cash' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE("CashRegister".doc, N'$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        CAST(JSON_VALUE(data, N'$.CashRegister') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, N'$.CashFlow') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE("CashRegister".doc, N'$.currency') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE("CashRegister".doc, N'$.Department') AS UNIQUEIDENTIFIER)`;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        if (Math.round(difference * 100) / 100 === 0) continue;

        // Loan
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Cash',
            data: {
                CashRegister: row.CashRegister,
                CashFlow: row.CashFlow,
                currency: row.currency,
                Amount: 0,
                AmountInBalance: difference < 0 ? -difference : difference
            }
        });

        // PL
        Registers.Accumulation.push({
            kind: true,
            type: 'Register.Accumulation.PL',
            data: {
                Department: row.Department,
                PL: difference < 0 ? Expense : Income,
                Analytics: AnaliticsExpenseCASH,
                Amount: difference
            }
        });

        // Balance
        Registers.Accumulation.push({
            kind: difference < 0 ? true : false,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
                Balance: BalancePL,
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
                Balance: BalanceCASH,
                Analytics: row.CashRegister,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const BANK = async () => {
    const queryText = `
    SELECT
        CAST(JSON_VALUE(data, N'$.BankAccount') AS UNIQUEIDENTIFIER) "BankAccount",
        CAST(JSON_VALUE(r.data, N'$.CashFlow') AS UNIQUEIDENTIFIER) "CashFlow",
        CAST(JSON_VALUE("BankAccount".doc, N'$.currency') AS UNIQUEIDENTIFIER) "currency",
        CAST(JSON_VALUE("BankAccount".doc, N'$.Department') AS UNIQUEIDENTIFIER) "Department",
        SUM(CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
        JOIN "Documents" "BankAccount" ON "BankAccount".id = CAST(JSON_VALUE(data, N'$.BankAccount') AS UNIQUEIDENTIFIER)
    WHERE
        r.type = N'Register.Accumulation.Bank' AND
        r.company = @p1 AND
        r.date <= @p2 AND
        CAST(JSON_VALUE("BankAccount".doc, N'$.currency') AS UNIQUEIDENTIFIER) <> @p3
    GROUP BY
        CAST(JSON_VALUE(data, N'$.BankAccount') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE(r.data, N'$.CashFlow') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE("BankAccount".doc, N'$.currency') AS UNIQUEIDENTIFIER),
        CAST(JSON_VALUE("BankAccount".doc, N'$.Department') AS UNIQUEIDENTIFIER) `;

    const queryResult = tx.manyOrNone(queryText, [doc.company, endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        if (Math.round(difference * 100) / 100 === 0) continue;

        // Loan
        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Bank',
            data: {
                BankAccount: row.BankAccount,
                CashFlow: row.CashFlow,
                currency: row.currency,
                Amount: 0,
                AmountInBalance: difference < 0 ? -difference : difference
            }
        });

        // PL
        Registers.Accumulation.push({
            kind: true,
            type: 'Register.Accumulation.PL',
            data: {
                Department: row.Department,
                PL: difference < 0 ? Expense : Income,
                Analytics: AnaliticsExpenseBANK,
                Amount: -difference
            }
        });

        // Balance
        Registers.Accumulation.push({
            kind: difference < 0 ? true : false,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
                Balance: BalancePL,
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: row.Department,
                Balance: BalanceBANK,
                Analytics: row.BankAccount,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

LOAN();
PERS();
AR();
AP();
CASH();
BANK();
doc.Amount = totalDiff;
