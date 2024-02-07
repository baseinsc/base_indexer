import { scanRowType } from "../utils/getTx";
import { db } from "./connectDb";

export const InsertRaw = (ts: scanRowType, str: string) => {
    return new Promise((_ok) => {
        db.run(
          `INSERT INTO RAW (blockNumber, decode_data, creator, input, hash, nonce, timeStamp)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            ts.blockNumber,
            str,
            ts.from?.toLocaleLowerCase(),
            ts.input,
            ts.hash,
            ts.nonce,
            ts.timeStamp,
          ],
          (err, row) => {
            if(err){
              console.log('error INSERT INTO RAW ', err, row)
              return
            }
            _ok('')
          }
        );
    })
}