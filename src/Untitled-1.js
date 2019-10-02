const ExpenseCOST = lib.doc.byCode('Catalog.Expense', 'Cost price', tx);
const IncomeSALES = lib.doc.byCode('Catalog.Income', 'SALES', tx);
const TRANSIT = lib.doc.byCode('Catalog.Balance', 'TRANSIT', tx);
const PL = lib.doc.byCode('Catalog.Balance', 'PL', tx);
const AR = lib.doc.byCode('Catalog.Balance', 'AR', tx);
const INVENTORY = lib.doc.byCode('Catalog.Balance', 'INVENTORY', tx);
const CashFlow = lib.doc.byCode('Catalog.CashFlow', '1.1.1.3', tx);
const BeginOfDayOut = new Date(doc.date.getFullYear(), doc.date.getMonth(), doc.date.getDate(), 20);

// Проведение взиморасчетов и движения ДС
for (let row of $.ItemsPay) {
  // Регистр - Расчеты с клиентами (AR)
  Registers.Accumulation.push({
    kind: true,
    type: 'Register.Accumulation.AR',
    date: BeginOfDayOut,
    data: {
      AO: doc.id,
      Department: $.Department,
      Customer: row.Client,
      AR: row.AmountPay,
      AmountInBalance: row.AmountPay / exchangeRate,
      PayDay: doc.date,
      currency: $.currency
    }
  });
  // Регистр - Активы и пассивы по статье Расчеты с клиентами (AR)
  Registers.Accumulation.push({
    kind: true,
    type: 'Register.Accumulation.Balance',
    data: {
      Department: $.Department,
      Balance: AR,
      Analytics: row.Client,
      Amount: row.AmountPay / exchangeRate,
    }
  });
  // Если оплата по эквайрингу то переводим на путь
  if (row.TypePay == "BANK") {
    Registers.Accumulation.push({
      kind: true,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: $.Department,
        Balance: TRANSIT,
        Analytics: row.BankAccount,
        Amount: row.AmountPay / exchangeRate,
      }
    });
    Registers.Accumulation.push({
      kind: false,
      type: 'Register.Accumulation.Balance',
      data: {
        Department: $.Department,
        Balance: AR,
        Analytics: row.Client,
        Amount: row.AmountPay / exchangeRate,
      }
    });
    Registers.Accumulation.push({
      kind: false,
      type: 'Register.Accumulation.AR',
      data: {
        AO: doc.id,
        Department: $.Department,
        Customer: row.Client,
        AR: row.AmountPay,
        AmountInBalance: row.AmountPay / exchangeRate,
        PayDay: doc.date,
        currency: $.currency
      }
    });

    Customer: row.Client;

    Registers.Accumulation.push({
      kind: true,
      type: "Register.Accumulation.Cash.Transit",
      date: BeginOfDayOut,
      data: {
        company: doc.copmany,
        Department: $.Department,
        CashFlow: CashFlow,
        Sender: row.Client,
        Recipient: row.BankAccount,
        Amount: row.AmountPay,
        currency: $.currency,
        AmountInBalance: row.AmountPay / exchangeRate
      }
    });
  }
};

let totalCost = 0;
let batchRows = $.ItemsInventory.map(row => ({
  SKU: row.SKU, Storehouse: $.Storehouse, Qty: row.Qty, Cost: 0, batch: null,
  res1: row.AmountDiscount, res2: 0, res3: 0, res4: 0, res5: 0
}));
batchRows = lib.inventory.batch(doc.date, doc.company, batchRows, tx);
for (const row of batchRows) {

  totalCost += row.Cost;

  Registers.Accumulation.push({
    kind: false,
    type: 'Register.Accumulation.Inventory',
    date: BeginOfDayOut,
    data: {
      Expense: ExpenseCOST,
      Storehouse: $.Storehouse,
      batch: row.batch,
      SKU: row.SKU,
      Cost: row.Cost,
      Qty: row.Qty
    }
  });

  Registers.Accumulation.push({
    kind: true,
    type: 'Register.Accumulation.Sales',
    date: BeginOfDayOut,
    data: {
      AO: doc.id,
      Department: $.Department,
      Customer: $.Customer,
      Product: row.SKU,
      Manager: $.Manager,
      Storehouse: $.Storehouse,
      Qty: row.Qty,
      Amount: row.res1 / exchangeRate,
      AmountInAR: row.res1,
      AmountInDoc: row.res1,
      Cost: row.Cost,
      Discount: 0,
      Tax: row.res2,
      currency: $.currency
    }
  });

  Registers.Accumulation.push({
    kind: true,
    type: 'Register.Accumulation.PL',
    date: BeginOfDayOut,
    data: {
      Department: $.Department,
      PL: IncomeSALES,
      Analytics: row.SKU,
      Amount: row.res1 / exchangeRate,
    }
  });

  Registers.Accumulation.push({
    kind: false,
    type: 'Register.Accumulation.PL',
    date: BeginOfDayOut,
    data: {
      Department: $.Department,
      PL: ExpenseCOST,
      Analytics: row.SKU,
      Amount: row.Cost,
    }
  });
}


Registers.Accumulation.push({
  kind: false,
  type: 'Register.Accumulation.Balance',
  data: {
    Department: $.Department,
    Balance: INVENTORY,
    Analytics: $.Storehouse,
    Amount: totalCost
  }
});

Registers.Accumulation.push({
  kind: true,
  type: 'Register.Accumulation.Balance',
  data: {
    Department: $.Department,
    Balance: PL,
    Analytics: ExpenseCOST,
    Amount: totalCost
  }
});

Registers.Accumulation.push({
  kind: false,
  type: 'Register.Accumulation.Balance',
  data: {
    Department: $.Department,
    Balance: PL,
    Analytics: IncomeSALES,
    Amount: AmountInBalance,
  }
});