import { handleResultToDb } from "./sync/txToDb"
import { zero_address } from "./utils/address"
import { fetchAccountTs, scanRowType } from "./utils/getTx"
import { dbGetBlockLast, dbSetBlockLast } from "./utils/io"
import * as dotenv from 'dotenv';
dotenv.config();

const { ETH_SCAN_API_KEY_2, DEX_ADDRESS } = process.env;

export const updateBase20 = async () => {
    const getTxs = async () => {
        await new Promise((ok) => setTimeout(ok, 5e3))

        const startblock = await dbGetBlockLast()
        console.log('startblock--->', startblock)
        const result = await fetchAccountTs(zero_address, startblock)
        const result_dex = await fetchAccountTs(DEX_ADDRESS, startblock, ETH_SCAN_API_KEY_2)

        if(result && result_dex){
            if(typeof (result as any)?.result === 'object' && typeof (result_dex as any)?.result === 'object'){
                const mergeResult = []
                .concat((result as any)?.result || [])
                .concat((result_dex as any)?.result || [])
                .sort((x, y) => Number(x.timeStamp) - Number(y.timeStamp))

                const _result = {
                    status: '1',
                    result: mergeResult as scanRowType[]
                }
                const lastBlock = await handleResultToDb(_result)

                if(lastBlock){
                    await dbSetBlockLast(lastBlock)
                }
                console.log('_result--->', _result.result.length)
                if(!lastBlock || lastBlock == startblock){
                    console.log('block null data ~~ ')
                    await new Promise((ok) => setTimeout(ok, 5e3))
                    const result = await fetchAccountTs(zero_address, (1 + Number(startblock)).toString(), void 0, "99999999", '2')
                    const result_dex = await fetchAccountTs(DEX_ADDRESS, (1 + Number(startblock)).toString(), ETH_SCAN_API_KEY_2, "99999999", '2')
                    const firstData1 = (result as any)?.result || []
                    const firstData2 = (result_dex as any)?.result || []
                    const minData: scanRowType[] = [...firstData1, ...firstData2]
                    
                    if(minData.length){
                        const minBlockNumber = Math.min(...minData.map(e => Number(e.blockNumber)))
                        
                        console.log('---minBlockNumber---', minBlockNumber)
                        await dbSetBlockLast(minBlockNumber.toString())
                    }else{
                        console.log('last not data')
                    }
                }
                await new Promise((ok) => setTimeout(ok, 5e3))
                getTxs()
            }else{
                console.log('(result as any)?.status', (result as any)?.status)
                await new Promise((ok) => setTimeout(ok, 5e3))
                getTxs()
            }
        }else{
            console.log('not new data')
            await new Promise((ok) => setTimeout(ok, 5e3))
            getTxs()
        }
    }
    getTxs()
    
}