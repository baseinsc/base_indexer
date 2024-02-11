import BigNumber from "bignumber.js"
import * as os from 'os';
import { db } from "./connectDb"
import { MARKET_FREEZE_STATUS, MARKET_LIST_STATUS, insertFreeze_sell } from "../utils/sql"
import { baseJsonType } from "./insertBase";
import { getBaseBalance } from "../select/balance";
import { verifyMessage } from "../utils/address";

/**
 {
  "op": "freeze_sell",
  "freeze": [
    {
      "tick": "base", // Seller Signature Information
      "nonce": (+new Date()).toString(), // Seller Signature Information
      "platform": "", // Seller signature information: corresponding platform
      "seller": "0x22222222222222222222222222222222222222222222", // Freeze the corresponding seller
      "amt": "333", // Seller Signature Information
      "value": "0.001", // Seller Signature Information
      "sign": sign // The seller authorizes the signature to verify the use
    }
  ]
}
 */

// export const FEE = 0.02
export const handle_freeze_sell = (ts: {
    value: string;
    from: string;
    hash: string;
    timeStamp: string;
}, json: baseJsonType) => {
    return new Promise(async (ok) => {
        try {
            const freeze = json?.freeze?.[0]
            if(freeze){
                const transerAmt = freeze.amt
                // check seller balance 
                const transferFromBalance = await getBaseBalance(freeze.seller.toLocaleLowerCase(), freeze.tick)
                if(
                    transferFromBalance && 
                    new BigNumber(transferFromBalance).isGreaterThanOrEqualTo(new BigNumber(transerAmt).multipliedBy(1e8))
                ){
                    const ether_gasPrice = freeze.gasPrice
                   
                    // check buyer payment
                    const payment = new BigNumber(freeze.value).multipliedBy(1).multipliedBy(1e18)
                    
                    if(new BigNumber(ts.value).multipliedBy(1e18).isGreaterThanOrEqualTo(payment)){
                        // verify message
                        const { isVerify, message } = verifyMessage({
                            tick: freeze.tick,
                            amt: freeze.amt,
                            nonce: freeze.nonce,
                            value: freeze.value,
                            sign: freeze.sign,
                        }, freeze.seller)
                        
                        if(isVerify){
                            // Whether the signature has been used
                            const used = await new Promise((ok) => {
                                db.get(`SELECT * FROM freeze_sell WHERE sign = ? AND tick = ? AND status = ?`, [
                                    freeze.sign,
                                    freeze.tick,
                                    MARKET_FREEZE_STATUS.freeze,
                                ], (_, row: any) => {
                                    if (row) return ok(1)
                                    ok(0)  
                                })
                            })
                            if(used) {
                                db.run(insertFreeze_sell, [
                                    freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                                    ts.timeStamp, 'signature has been used', freeze.sign, freeze.seller,
                                    freeze.value, ts.hash, freeze.amt,
                                ])
                                // TODO refud
                            }else{
                                // console.log('---insertFreeze_sell----', insertFreeze_sell)
                                db.run(insertFreeze_sell, [
                                    freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.freeze,
                                    ts.timeStamp, message, freeze.sign, freeze.seller,
                                    freeze.value, ts.hash, freeze.amt,
                                ])
                                // update market list
                                db.run(`UPDATE market_list SET status = ? WHERE sign = ? AND tick = ?`, [
                                    MARKET_LIST_STATUS.pending,
                                    freeze.sign,
                                    freeze.tick,
                                ])
                                //Dex
                            }
                        }else{
                            db.run(insertFreeze_sell, [
                                freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                                ts.timeStamp, message, freeze.sign, freeze.seller,
                                freeze.value, ts.hash, freeze.amt,
                            ])
                        }
                    }else{
                        db.run(insertFreeze_sell, [
                            freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                            ts.timeStamp, 'buyer has no balance', freeze.sign, freeze.seller,
                            freeze.value, ts.hash, freeze.amt,
                        ])
                    }
                }else{
                    db.run(insertFreeze_sell, [
                        freeze.tick, ts.from.toLocaleLowerCase(), ts.value, MARKET_FREEZE_STATUS.error,
                        ts.timeStamp, 'seller has no balance', freeze.sign, freeze.seller,
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
