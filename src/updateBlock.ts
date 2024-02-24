import { Alchemy, Network } from "alchemy-sdk";
import { handleResultToDb } from "./sync/txToDb"
import { zero_address } from "./utils/address"
import { fetchAccountTs, scanRowType } from "./utils/getTx"
import { dbGetBlockLast, dbSetBlockLast } from "./utils/io"
import * as dotenv from 'dotenv';
dotenv.config();

const { WEB3RPC_KEY, ETH_SCAN_API_KEY_2, DEX_ADDRESS } = process.env;

const settings = {
    apiKey: WEB3RPC_KEY,
    network: Network.BASE_MAINNET,
};
export const updateBase20 = async () => {
    const getTxs = async () => {
        try {
            await new Promise((ok) => setTimeout(ok, 1e3))

            const alchemy = new Alchemy(settings);
            const last_block = await alchemy.core.getBlockNumber()
            const startblock = Number(await dbGetBlockLast())
            const _endblock = startblock + 10000
            const endblock = _endblock >= last_block ? last_block : _endblock 
            const result = await fetchAccountTs(zero_address, startblock + '', void 0, endblock + '')
            const result_dex = await fetchAccountTs(DEX_ADDRESS, startblock + '', ETH_SCAN_API_KEY_2, endblock + '')

            if (result && result_dex) {
                if (typeof (result as any)?.result === 'object' && typeof (result_dex as any)?.result === 'object') {
                    const row1 = (result as any)?.result || []
                    const row2 = (result_dex as any)?.result || []
                    const _mergeResult: scanRowType[] = []
                        .concat(row1)
                        .concat(row2)
                        .sort((x, y) => Number(x.timeStamp) - Number(y.timeStamp))
                    
                    let minBlockNumber = 99999999999
                    if(row1.length && row2.length){
                        const minBlockNumber1 = Math.max(...row1.map(e => Number(e.blockNumber)))
                        const minBlockNumber2 = Math.max(...row2.map(e => Number(e.blockNumber)))
                        minBlockNumber = Math.min(minBlockNumber1, minBlockNumber2)
                    }

                    const mergeResult = _mergeResult.filter((e) => Number(e.blockNumber) <= minBlockNumber)
                    const _result = {
                        status: '1',
                        result: mergeResult
                    }
                    const lastBlock = await handleResultToDb(_result)

                    if (lastBlock) {
                        await dbSetBlockLast((Number(lastBlock) + 1).toString())
                    }
                    if(!lastBlock && mergeResult.length === 0){
                        await dbSetBlockLast(endblock + 1 + '')
                    }
                    getTxs()
                } else {
                    console.log('(result as any)?.status', (result as any)?.status)
                    await new Promise((ok) => setTimeout(ok, 5e3))
                    getTxs()
                }
            } else {
                console.log('not new data')
                await new Promise((ok) => setTimeout(ok, 5e3))
                getTxs()
            }

        } catch (error) {
            console.log("error::", error)
            getTxs()
        }
    }
    getTxs()

}
