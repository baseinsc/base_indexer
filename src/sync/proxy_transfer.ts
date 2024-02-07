import BigNumber from "bignumber.js"
import { getBaseBalance } from "../select/balance"
import { scanRowType } from "../utils/getTx"
import { db } from "./connectDb"
import { baseJsonType } from "./insertBase"
import { MARKET_FREEZE_STATUS, MARKET_LIST_STATUS, insertBalanceChangeSql, insertFreeze_sell, insertMarketListed } from "../utils/sql"
import { verifyMessage } from "../utils/address"

/**
{
  "p": "base-20",
  "op": "proxy_transfer", //transfer operation
  "proxy": [
    {
      "tick": "base", // tick
      "nonce": (+new Date()).toString(), // nonce
      "from": sellerAddress, // seller address, verify
      "to": "0x22222222222222222222222222222222222222222222", // buyer address (test)
      "amt": "333",
      "value": "0.001",
      "sign": sign // the agent must carry the signature to the chain, which can be confirmed
    }
  ]
}
 */

const FEE = 0.02
export const handle_proxy_transfer = (ts: {
    value: string;
    from: string;
    hash: string;
    timeStamp: string;
    blockNumber: string;
}, json: baseJsonType) => {
    return new Promise(async (ok) => {
        try {
            const freeze = json?.proxy?.[0]
            if(freeze){
                const transerAmt = freeze.amt
                // check seller balance 
                const transferFromBalance = await getBaseBalance(freeze.from.toLocaleLowerCase(), freeze.tick)
                if(
                    transferFromBalance && 
                    new BigNumber(transferFromBalance).isGreaterThanOrEqualTo(new BigNumber(transerAmt).multipliedBy(1e8))
                ){
                    // check buyer payment
                    const payment = new BigNumber(freeze.value)
                    if(new BigNumber(ts.value).multipliedBy(1e18).isGreaterThanOrEqualTo(payment)){
                        // verify message
                        const { isVerify, message } = verifyMessage({
                            tick: freeze.tick,
                            amt: freeze.amt,
                            nonce: freeze.nonce,
                            value: freeze.value,
                            sign: freeze.sign,
                        }, freeze.from)
                        if(isVerify){
                            // Whether the signature has been used (proxy transfer) (A sale can only be purchased once)
                            const used = await new Promise((ok) => {
                                db.get(`SELECT * FROM market_listed WHERE sign = ? AND tick = ?`, [
                                    freeze.sign,
                                    freeze.tick,
                                ], (_, row: any) => {
                                    if (row) return ok(1)
                                    ok(0)  
                                })
                            })
                            // console.log('used---', used)
                            if(used) {
                                db.run(insertFreeze_sell, [
                                    freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                                    ts.timeStamp, 'signature has been used(proxy trasnfer)', freeze.sign, freeze.from,
                                    freeze.value, ts.hash, freeze.amt,
                                ])
                            }else{
                                db.serialize(() => {
                                    const balanceChange = new BigNumber(freeze.amt).multipliedBy(1e8).toFixed(0)
                                    let sql = `UPDATE balances SET balance = balance - ? WHERE address = ? AND tick = ?`;
                                    db.run(sql, [balanceChange, freeze.from.toLocaleLowerCase(), freeze.tick]);

                                    let insertNewAddrSql = `INSERT OR IGNORE INTO balances (address, tick, balance) VALUES (?, ?, 0)`;
                                    db.run(insertNewAddrSql, [freeze.to.toLocaleLowerCase(), freeze.tick]);

                                    let sql2 = `UPDATE balances SET balance = balance + ? WHERE address = ? AND tick = ?`;
                                    db.run(sql2, [balanceChange, freeze.to.toLocaleLowerCase(), freeze.tick]);

                                    db.run(`UPDATE freeze_sell SET status = ? WHERE seller = ? AND tick = ? AND sign = ?`, 
                                        MARKET_FREEZE_STATUS.thaw, 
                                        freeze.from.toLocaleLowerCase(), 
                                        freeze.tick, 
                                        freeze.sign, 
                                    )
                                    // update market list end
                                    db.run(insertMarketListed, [
                                        freeze.tick, freeze.to.toLocaleLowerCase(), freeze.nonce, 
                                        ts.timeStamp, message, freeze.sign,
                                        freeze.from.toLocaleLowerCase(), ts.hash, ts.blockNumber,
                                        ts.value, freeze.amt, 
                                    ])
                                    // UPDATE market_list
                                    db.run(`UPDATE market_list SET status = ? WHERE sign = ? AND tick = ?`, [
                                        MARKET_LIST_STATUS.listed,
                                        freeze.sign,
                                        freeze.tick,
                                    ])
                                    
                                    db.run(insertBalanceChangeSql, [
                                        ts.from.toLocaleLowerCase(),
                                        freeze.from.toLocaleLowerCase(),
                                        freeze.to.toLocaleLowerCase(),
                                        ts.timeStamp,
                                        freeze.tick,
                                        ts.hash,
                                        ts.blockNumber,
                                        json.nonce,
                                        1,
                                        freeze.amt,
                                    ])
                                })
                            }
                        }else{
                            db.run(insertFreeze_sell, [
                                freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                                ts.timeStamp, "message (proxy trasnfer)", freeze.sign, freeze.from.toLocaleLowerCase(),
                                freeze.value, ts.hash, freeze.amt,
                            ])
                        }
                    }
                }else{
                    db.run(insertFreeze_sell, [
                        freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                        ts.timeStamp, 'seller has no balance (proxy trasnfer)', freeze.sign, freeze.from.toLocaleLowerCase(),
                        freeze.value, ts.hash, freeze.amt,
                    ])
                }
            }
            ok('')
        } catch (error) {
            ok('')
        }
    })
}
