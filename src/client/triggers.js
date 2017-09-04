{
    "after-post": "const accountRow = {datetime: new Date(), operation: '+', document: doc.id, dt: '50.1', dt_subcount: doc.description, dt_subcount2: '', dt_subcount3: '', dt_subcount4: '', dt_qty: 0, dt_cur: '', kt: '60.3.3', kt_subcount1: '', kt_subcount2: '', kt_subcount3: '', kt_subcount4: '', kt_qty: 0, kt_cur: '', sum: 10}; Registers.Account.push(accountRow);return Registers;",
    "before-post": "doc.code = doc.code + 'b';"
}