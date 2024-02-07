import BigNumber from "bignumber.js";
import { base721JsonType } from "../insertBase";
import { scanRowType } from "../../utils/getTx";
import { db } from "../connectDb";
import { insert721ChangeSql } from "../../utils/sql";

const is721Owner = async (address: string, hash: string) => {
    return await new Promise<any>((ok, reject) => {
        db.get("SELECT * FROM BASE_ERC_721_OWNER WHERE owner = ? AND hash = ?", [address, hash], (err, row: any) => {
            if (err) {
              ok(false)
            } else if (row) {
                ok(row)
            } else {
                ok(false)
                // console.log(`No balance found for address ${myAddress}`);
            }
        });
    })
}
export const transfer721Handle = (ts: scanRowType, json: base721JsonType) => {
  return new Promise(async (ok) => {
    for (const transferItem of json.to) {
      const ownerInfo = await is721Owner(ts.from.toLocaleLowerCase(), transferItem?.hash.toLocaleLowerCase())
      // send to recv
      if (
        ownerInfo &&
        transferItem?.recv &&
        transferItem.recv[0] === "0" &&
        transferItem.recv[1] === "x" &&
        transferItem.recv.length === 42 &&
        // to address not self
        transferItem.recv.toLocaleLowerCase() !== ts.from.toLocaleLowerCase() &&
        transferItem.hash &&
        transferItem.hash.length === 66
      ) {
            db.run(insert721ChangeSql, [
              ts.from.toLocaleLowerCase(),
              ts.from.toLocaleLowerCase(),
              transferItem?.recv?.toLocaleLowerCase(),
              ts.timeStamp,
              json.tick,
              transferItem.hash, // json.tokenId,
              ts.hash,
              ts.blockNumber,
              1,
            ]);

            let updateSql = `UPDATE BASE_ERC_721_OWNER SET owner = ? WHERE hash = ?`;
            db.run(
              updateSql,
              [transferItem?.recv?.toLocaleLowerCase(), transferItem.hash],
              (err, row) => {
                !err
                  ? ok(row)
                  : console.log("SELECT error Insert base 721 hash", err, ts.hash);
              }
            );
      }else{
        console.log('transfer721Handle error', transferItem.hash)
        db.run(insert721ChangeSql, [
              ts.from.toLocaleLowerCase(),
              ts.from.toLocaleLowerCase(),
              transferItem?.recv?.toLocaleLowerCase(),
              ts.timeStamp,
              json.tick,
              transferItem.hash, // json.tokenId,
              ts.hash,
              ts.blockNumber,
              0,
          ]);
      }
    }
    ok("");
  });
};
