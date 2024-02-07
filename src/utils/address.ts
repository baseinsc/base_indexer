import { ethers } from "ethers";

const { DEX_ADDRESS } = process.env;

export const zero_address = "0x0000000000000000000000000000000000000000"

export const verifyMessage = (data: {
    tick: string;
    amt: string;
    nonce: string;
    value: string;
    sign: string;
}, seller: string) => {
    const message = JSON.stringify({
        title: 'base-20 one approve',
        to: DEX_ADDRESS, 
        tick: data.tick,
        amt: data.amt,
        value: data.value,
        nonce: data.nonce,
    }, null, 4)
    const recoveredAddress = ethers.utils.verifyMessage(message, data.sign)
    // console.log('---recoveredAddress--', recoveredAddress)
    if(recoveredAddress.toLocaleLowerCase() === seller?.toLocaleLowerCase()){
        return {
            isVerify: true, 
            message
        }
    }else{
        return {
            isVerify: false, 
            message
        }
    }
}