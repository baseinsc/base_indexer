import BigNumber from "bignumber.js"
import { getBaseBalance } from "../../select/balance"
import { scanRowType } from "../../utils/getTx"
import { base721JsonType, baseJsonType } from "../insertBase"
import { db } from "../connectDb"
import { insertBalanceChangeSql } from "../../utils/sql"
import { zero_address } from "../../utils/address"

export const mint721Handle = (ts: scanRowType, json: base721JsonType) => {
    if(
        (json["content-type"] && json.content) || 
        (json.tokenId && json.tick)
    ){
        db.run(`INSERT OR IGNORE INTO BASE_ERC_721_OWNER (owner, hash) VALUES (?, ?)`, [ts.from.toLocaleLowerCase(), ts.hash])
    }
}