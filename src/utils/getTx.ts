import puppeteer from 'puppeteer';
import * as os from 'os';

import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const { DUNE_API_KEY, ETH_SCAN_API_KEY, ETHSACN_BASE_URL } = process.env;

export const fetchAccountTs = async (address: string, start_block = "4037124", apikey = ETH_SCAN_API_KEY, endblock?: string, offset?: string): Promise< {
    status: string;
    result: scanRowType[];
  } | void> => {
    try {
      const baseUrl = ETHSACN_BASE_URL
     
      const uri = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=${start_block}&endblock=${endblock ? endblock : (parseInt(start_block) + 10000)}&page=1&offset=${offset || 10000}&sort=asc&apikey=${apikey}`
      if (os.platform() !== 'linux') {
        console.log(uri)
      }
      if (os.platform() === 'linux') {
        const res = await axios.get(uri)
        // console.log('res---> ', res.data)
        return res.data
      } else {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(uri);
        // const content = await page.content();
        const data = await page.evaluate(() => {
          const text = document.getElementsByTagName('html')[0].innerText
          return JSON.parse(text)
        });
      
        await browser.close();
      
        return data
      }

    } catch (error) {
      console.log('fetchAccountTs error', error)
    }
  }
  
export type scanRowType = {
    blockHash: string;
    blockNumber: string;
    confirmations: string;
    contractAddress: string;cumulativeGasUsed: string;
    from: string;
    functionName: string;gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    isError: string;
    methodId: string;
    nonce: string;
    timeStamp: string;
    to: string;
    transactionIndex: string;
    txreceipt_status: string;
    value: string;
  }