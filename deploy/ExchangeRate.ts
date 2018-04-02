const lib: any = null;
const doc: any = null;
const tx: any = null;
const Registers: any = null;
/////////////////

const balanceCurrency = lib.doc.byCode('Catalog.Currency', 'UAH');
const Expense = lib.doc.byCode('Catalog.Expense', 'EXCH.LOSS');
const Income = lib.doc.byCode('Catalog.Income', 'EXCH.PROFIT');
const AnaliticsExpenseLOAN = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.LOAN');
const AnaliticsExpensePERS = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.PERS');
const AnaliticsExpenseAP = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AP');
const AnaliticsExpenseAR = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.AR');
const AnaliticsExpenseCASH = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.CASH');
const AnaliticsExpenseBANK = lib.doc.byCode('Catalog.Expense.Analytics', 'EXCH.BANK');
const endOfMonth = new Date(new Date(doc.date).getFullYear(), new Date(doc.date).getMonth() + 1, 0);
endOfMonth.setHours(23, 59, 59);

const LOAN = async () => {
    const queryText = `
    SELECT
      JSON_VALUE(r.data, N'$.Loan') "Loan", currency.id "currency", JSON_VALUE(r.data, N'$.Counterpartie') "Counterpartie",
      SUM(CAST(JSON_VALUE(data, N'$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
      SUM(CAST(JSON_VALUE(data, N'$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
    JOIN "Documents" "Loan" ON "Loan".id = JSON_VALUE(data, N'$.Loan')
    JOIN "Documents" "currency" ON currency.id = JSON_VALUE("Loan".doc, N'$.currency') AND currency.code <> N'UAH'
    WHERE r.type = N'Register.Accumulation.Loan' AND r.date <= @p1
    GROUP BY JSON_VALUE(r.data, N'$.Loan'), JSON_VALUE(r.data, N'$.Counterpartie'), currency.id `;

    const queryResult = tx.manyOrNone(queryText, [endOfMonth]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        const LoanObject = lib.doc.byId(row.Loan);
        const Department = LoanObject ? LoanObject.Department : null;

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
                Balance: lib.doc.byCode('Catalog.Balance', 'PL', tx),
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: lib.doc.byCode('Catalog.Balance', 'LOAN', tx),
                Analytics: row.Counterpartie,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

const PERS = async () => {
    const queryText = `
    SELECT
        JSON_VALUE(r.data, '$.CashFlow') "CashFlow",
        JSON_VALUE(r.data, '$.Employee') "Employee",
        JSON_VALUE(r.data, '$.currency') "currency",
        SUM(CAST(JSON_VALUE(data, '$.Amount') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "Amount",
        SUM(CAST(JSON_VALUE(data, '$.AmountInBalance') AS MONEY) * CASE WHEN kind = 1 THEN 1 ELSE -1 END) "AmountInBalance"
    FROM "Accumulation" r
    WHERE r.type = 'Register.Accumulation.AccountablePersons' AND r.date <= @p1 AND JSON_VALUE(r.data, '$.currency') <> @p2
    GROUP BY JSON_VALUE(r.data, '$.CashFlow'), JSON_VALUE(r.data, '$.Employee'), JSON_VALUE(r.data, '$.currency')`;

    const queryResult = tx.manyOrNone(queryText, [endOfMonth, balanceCurrency]);
    for (const row of queryResult) {
        const kurs = lib.info.sliceLast('ExchangeRates', endOfMonth, doc.company, 'Rate', { currency: row.currency }, tx) || 1;
        const Amount = row.Amount / kurs;
        const difference = Amount - row.AmountInBalance;
        const EmployeeObject = lib.doc.byId(row.Employee);
        const Department = EmployeeObject ? EmployeeObject.Department || null : null;

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
                Balance: lib.doc.byCode('Catalog.Balance', 'PL', tx),
                Analytics: difference < 0 ? Expense : Income,
                Amount: difference < 0 ? -difference : difference
            }
        });

        Registers.Accumulation.push({
            kind: difference < 0 ? false : true,
            type: 'Register.Accumulation.Balance',
            data: {
                Department: Department,
                Balance: lib.doc.byCode('Catalog.Balance', 'EMPLOYEE', tx),
                Analytics: row.Counterpartie,
                Amount: difference < 0 ? -difference : difference
            }
        });
    }
};

LOAN();
PERS();
