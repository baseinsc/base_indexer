import { db } from "../sync/connectDb";

export const getBaseBalance = (myAddress: string, tick: string) => {
    return new Promise<string>((ok, reject) => {
        db.get("SELECT balance FROM balances WHERE address = ? AND tick = ?", [myAddress.toLocaleLowerCase(), tick], (err, row: any) => {
            if (err) {
                reject('err')
            } else if (row) {
                ok(row.balance)
            } else {
                ok("0")
                // console.log(`No balance found for address ${myAddress}`);
            }
        });
    })
}

export const getBaseBalances = (myAddress: string) => {
    return new Promise<{balance: string; tick: string}[]>((ok, reject) => {
        db.all("SELECT * FROM balances WHERE address = ?", [myAddress.toLocaleLowerCase()], (err, rows: any) => {
            if (err) {
                reject('err')
            } else if (rows) {
                ok(rows)
            } else {
                ok([])
                // console.log(`No balance found for address ${myAddress}`);
            }
        });
    })
}
