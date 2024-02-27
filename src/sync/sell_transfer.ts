import BigNumber from "bignumber.js"
import { getBaseBalance } from "../select/balance"
import { scanRowType } from "../utils/getTx"
import { baseJsonType } from "./insertBase"
import { db } from "./connectDb"
import { insertBalanceChangeSql } from "../utils/sql"
import { zero_address } from "../utils/address"

export const sell_token = (ts: scanRowType, json: baseJsonType) => {
    return new Promise(async (ok) => {
        try {
            // TODO
        } catch (error) {
            console.log('sell_token error--->', error)
        }
        ok('')
    })
}
export const buy_token = (ts: scanRowType, json: baseJsonType) => {
    return new Promise(async (ok) => {
        try {
            // TODO
        } catch (error) {
            console.log('buy_token error--->', error)
        }
        ok('')
    })
}
