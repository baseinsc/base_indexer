import BigNumber from "bignumber.js";
import { scanRowType } from "../utils/getTx";
import { db } from "./connectDb";
import { transferHandle } from "./transfer";
import { mintHandle } from "./mint";
import { handle_proxy_transfer } from "./proxy_transfer";
import { mint721Handle } from "./721/mint";
import { transfer721Handle } from "./721/transfer";

interface iTo {
    recv: string;
    amt: string;
}
interface type_freeze_sell {
    tick: string;
    nonce: string;
    platform: string;
    seller: string;
    amt: string;
    value: string;
    sign: string;
    gasPrice: string;
}
interface type_proxy_transfer {
    tick: string;
    nonce: string;
    from: string;
    to: string;
    amt: string;
    value: string;
    sign: string;
}
export type baseJsonType = {
    p?: string;
    op?: 'deploy' | 'mint' | 'transfer' | 'proxy_transfer' | 'freeze_sell';
    tick?: string;
    afrom?: string;
    amt?: string;
    max?: string;
    lim?: string;
    wlim?: string;
    dec?: string;
    nonce?: string;
    blockNumber?: string;
    to?: iTo[];
    freeze?: type_freeze_sell[];
    proxy?: type_proxy_transfer[];
}

export type base721JsonType = {
    p?: string;
    op?: 'deploy' | 'mint' | 'transfer' | 'proxy_transfer' | 'freeze_sell';
    tick?: string;
    afrom?: string;
    tokenId?: string;
    "content-type"?: string;
    content?: string;
    max?: string;
    lim?: string;
    wlim?: string;
    name?: string;
    blim?: string;
    dec?: string;
    nonce?: string;
    blockNumber?: string;
    to?: {
        hash: string;
        recv: string;
    }[];
    freeze?: type_freeze_sell[];
    proxy?: type_proxy_transfer[];
}

const transferCheck = async (
    ts: {
        nonce: string;
	from: string;
	blockNumber: string;
    }, 
    tick: string,
    to?: iTo[], 
    nonce?: string,
    amt?: string,
): Promise<boolean> => {    
    const transferLists = await new Promise((ok) => {
        db.all(`SELECT * FROM BASE_ERC WHERE op = ? AND tick = ? AND afrom = ?`, ["transfer", tick, ts.from.toLocaleLowerCase()], (err, row: any) => {
            !err ? ok(row) : console.log('SELECT error InsertBase transfer', err) 
        })
    }) as baseJsonType[]


    try {
        // 6491116
        const freezeLists = await new Promise((ok) => {
            db.all(`SELECT * FROM freeze_sell WHERE  tick = ? AND seller = ? ORDER BY ID DESC`, [tick, ts.from.toLocaleLowerCase()], (err, row: any) => {
                !err ? ok(row) : console.log('SELECT error InsertBase transfer freezeLists', err)
            })
        }) as {hash: string}[]
        const rawInfo = await new Promise((ok) => {
            db.get(`SELECT ID, hash, blockNumber, timeStamp, creator FROM RAW WHERE hash = ?`, [freezeLists?.[0]?.hash], (err, row: any) => {
                !err ? ok(row) : console.log('SELECT error InsertBase transfer blockNumber', err)
            })
        }) as { blockNumber?: number }
        const blockNumber = rawInfo?.blockNumber
	if(freezeLists.length > 0 && blockNumber && Number(blockNumber) + 600 > Number(ts.blockNumber) ){
            return false
        }
    } catch (error) {
        console.log('error::', error)
    }


    let nonces: string[] = []
    for (const mintInfo of transferLists) {
        nonces.push(mintInfo.nonce)
    }
    if(
        to 
        && to.length 
        // && nonce == ts.nonce
        // nonce
	// && !nonces.includes(nonce)
    ){
        const total_amt = to.map(e => e.amt).reduce((a, b) => {
            return new BigNumber(a).plus(b).toFixed(0)
        })
        if(
            new BigNumber(total_amt).isEqualTo(new BigNumber(amt))
        ){
            return true
        }else{
            // console.log('transfer error')
        }
    }
    return true
}


export const InsertBase = (ts: scanRowType, json: baseJsonType) => {
    return new Promise(async (_ok) => {
        let to_str = ''
        if(json.tick){
            if(json.op === 'deploy'){
                if(json.max && parseInt(json.max) >= parseInt(json.lim)){
                    // let updateSql = `UPDATE BASE_ERC_tick SET amount = ?, holder = ?, max =?, creator = ?, time = ? WHERE tick = ?`;
                    let insertSql = `INSERT OR IGNORE INTO BASE_ERC_tick (tick, amount, holder, max, creator, time, json) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    db.run(insertSql, [json.tick, 0, 0, json.max, ts.from.toLocaleLowerCase(), ts.timeStamp, JSON.stringify(json)]);
                }else{
                    console.log('deploy error')
                }
            }
            if(json.op === 'mint') {
                // console.log('mint')
                await mintHandle(ts, json)
            }
            if(json.op === 'transfer'){
                const isCheckTransfer = await transferCheck(ts, json.tick, json.to, json.nonce, json.amt)
                    if(isCheckTransfer){
                        to_str = JSON.stringify(json.to)
                        await transferHandle(ts, json)    
                    }else{
                        // console.log('transferCheck error', JSON.stringify(json), ts.hash)
                    }
                    // await transferHandle(ts, json)
            }
        }else{
            if(json.op === 'freeze_sell'){
                // console.log('freeze_sell')
                // await handle_freeze_sell(ts, json)
            }
            if(json.op === 'proxy_transfer'){
                // console.log('proxy_transfer')
                await handle_proxy_transfer(ts, json)
            }
        }
        db.run(
          `INSERT INTO BASE_ERC (
            p, op, tick, afrom, 
            amt, max, lim, wlim, 
            dec, nonce,
            ato, blockNumber,
            hash
            )
            VALUES ( 
              ?, ?, ?, ?, 
              ?, ?, ?, ?, 
              ?, ?,
              ?, ?,
              ?
            )`,
          [
            json.p,
            json.op,
            json.tick,
            ts.from.toLocaleLowerCase(),
            json.amt,
            json.max,
            json.lim,
            json.wlim,
            json.dec,
            json.nonce,
            to_str || '',
            ts.blockNumber,
            ts.hash,
          ],
          (err, row) => {
            if(err){
                console.log('INSERT INTO BASE_ERC err, row', err, row)
                return
            }
            _ok('')
          }
        );
    })
}

export const Insert721 = (ts: scanRowType, json: base721JsonType) => {
    return new Promise(async (_ok) => {
        let to_str = ''
        
            // TODO
            // if(json.op === 'deploy'){
            //     if(json.max && parseInt(json.max) >= parseInt(json.lim)){
            //         // let updateSql = `UPDATE BASE_ERC_tick SET amount = ?, holder = ?, max =?, creator = ?, time = ? WHERE tick = ?`;
            //         let insertSql = `INSERT OR IGNORE INTO BASE_ERC_tick (tick, amount, holder, max, creator, time, json) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            //         db.run(insertSql, [json.tick, 0, 0, json.max, ts.from.toLocaleLowerCase(), ts.timeStamp, JSON.stringify(json)]);
            //     }else{
            //         console.log('deploy error')
            //     }
            // }
            
        if(json.op === 'mint') {
            // console.log('mint')
            mint721Handle(ts, json)
        }
        if(json.op === 'transfer'){
            await transfer721Handle(ts, json)
        }
    

        db.run(
          `INSERT INTO BASE_ERC_721 (
            p, op, tick, afrom, 
            tokenId, max, lim, wlim, 
            blim, dec, nonce,
            ato, blockNumber,
            hash
            )
            VALUES ( 
              ?, ?, ?, ?, 
              ?, ?, ?, ?, 
              ?, ?, ?,
              ?, ?,
              ?
            )`,
          [
            json.p,
            json.op,
            json.tick,
            ts.from.toLocaleLowerCase(),
            json.tokenId,
            json.max,
            json.lim,
            json.wlim,
            json.blim,
            json.dec,
            json.nonce,
            to_str || '',
            ts.blockNumber,
            ts.hash,
          ],
          (err, row) => {
            if(err){
                console.log('INSERT INTO 721 BASE_ERC err, row', err, row)
                return
            }
            _ok('')
          }
        );
    })
}
