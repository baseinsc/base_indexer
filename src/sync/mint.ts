import BigNumber from "bignumber.js"
import { getBaseBalance } from "../select/balance"
import { scanRowType } from "../utils/getTx"
import { baseJsonType } from "./insertBase"
import { db } from "./connectDb"
import { insertBalanceChangeSql } from "../utils/sql"
import { zero_address } from "../utils/address"

export const mintHandle = (ts: scanRowType, json: baseJsonType) => {
    return new Promise(async (ok) => {
        try {
            const deploy = await new Promise((ok) => {
                db.get(`SELECT * FROM BASE_ERC WHERE op = ? AND tick = ?`, ["deploy", json.tick], (err, row: any) => {
                    !err ? ok(row) : console.log('SELECT error InsertBase deploy', err) 
                })
            }) as baseJsonType
            if(!deploy){
                console.log('mint error, json.tick not fund', json.tick, deploy)
                ok('')
                return
            }
            const mintLists = await new Promise((ok) => {
                db.all(`SELECT * FROM BASE_ERC WHERE op = ? AND tick = ? AND afrom = ?`, ["mint", json.tick, ts.from.toLocaleLowerCase()], (err, row: any) => {
                    !err ? ok(row) : console.log('SELECT error InsertBase mint', err) 
                })
            }) as baseJsonType[]
            
            const balance = await getBaseBalance(ts.from.toLocaleLowerCase(), json.tick)
            const _tickInfo: {amount: number} = await new Promise((ok) => {
                db.get(`SELECT amount FROM BASE_ERC_tick WHERE tick = ?`, [json.tick, ], (err, row: any) => {
                    !err ? ok(row) : console.log('SELECT error InsertBase BASE_ERC_tick', err) 
                })
            })
            const tickInfo = _tickInfo ?? {
                amount: 0,
            }
            let w_amt = new BigNumber(balance).div(1e8).toNumber()
            let nonces: string[] = []
            let blocks: string[] = []
            for (const mintInfo of mintLists) {
                // w_amt += parseInt(mintInfo?.amt || '0')
                nonces.push(mintInfo.nonce)
                blocks.push(mintInfo.blockNumber.toString())
            }

            const data = json
            const amt = parseInt(json.amt)
            const nonce = parseInt(json.nonce)
            if(
                json.amt
                && json.nonce
                && json.nonce === nonce.toString()
                // nonce
                && !nonces.includes(json.nonce)
                // block
                && !blocks.includes(ts.blockNumber.toString())
                // amt
                && data.amt == amt.toString()
                // limit
                && new BigNumber(json.amt).isLessThanOrEqualTo(deploy.lim)
                // max limit
                && w_amt < parseInt(deploy.wlim)
                // total mint
                && new BigNumber(tickInfo.amount).plus(new BigNumber(json.amt)).isLessThanOrEqualTo(new BigNumber(deploy.max))
            ){
                // console.log('---update mint---')
                const update = {
                    balanceChange: new BigNumber(json.amt).multipliedBy(1e8).toFixed(0),
                    address: ts.from.toLocaleLowerCase(),
                }
                // update tick
                let sql = `UPDATE BASE_ERC_tick SET amount = amount + ?, holder = holder + ? WHERE tick = ?`;
                await new Promise((ok) => {
                    db.run(sql, [parseInt(json.amt), w_amt === 0 ? 1 : 0, json.tick], (err, row) => {
                        !err ? ok(row) : console.log('SELECT error InsertBase update tick', err) 
                    });
                })
                // console.log('---update balance---', update)
                // update balance
                let insertSql = `INSERT OR IGNORE INTO balances (address, tick, balance) VALUES (?, ?, 0)`;
                let updateSql = `UPDATE balances SET balance = balance + ? WHERE address = ? AND tick = ?`;
                await new Promise((ok) => {
                    db.serialize(() => {
                        db.run(insertSql, [update.address, json.tick]);
                        db.run(insertBalanceChangeSql, [
                            ts.from.toLocaleLowerCase(),
                            zero_address,
                            ts.from.toLocaleLowerCase(),
                            ts.timeStamp,
                            json.tick,
                            ts.hash,
                            ts.blockNumber,
                            json.nonce,
                            1,
                            json.amt,
                        ])
                        db.run(updateSql, [update.balanceChange, update.address, json.tick], (err, row) => {
                            !err ? ok(row) : ok('')
                        });
                    })
                })
            }else{
                // console.log('error mint', w_amt)
                db.run(insertBalanceChangeSql, [
                    ts.from.toLocaleLowerCase(),
                    zero_address,
                    ts.from.toLocaleLowerCase(),
                    ts.timeStamp,
                    json.tick,
                    ts.hash,
                    ts.blockNumber,
                    json?.nonce ?? 0,
                    0,
                    json?.amt ?? 0,
                ])
            }
        } catch (error) {
            console.log('mint error--->', error)
        }
        ok('')
    })
}