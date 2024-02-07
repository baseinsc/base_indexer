import { scanRowType } from "../utils/getTx";
import { hexToString } from "../utils/hextostr";
import { db } from "./connectDb";
import { InsertRaw } from "./insertRaw";
import { Insert721, InsertBase, base721JsonType, baseJsonType } from "./insertBase";


export const handleResultToDb = async (data: {
  status: string;
  result: scanRowType[];
}) => {
  return new Promise<string>(async (ok) => {
    if (data) {
      let lastBlock = "";
      if (data.status == "1") {
        const res = data.result as scanRowType[];
        const prefix_hex = "0x646174613a6170706c69636174696f6e2f6a736f6e2c";
        const prefix = "data:application/json,";

        // console.log('handle ts')
        for (const ts of res) {
          if (ts.blockNumber) {
            lastBlock = ts.blockNumber;
          }
          if (ts?.input && ts.input.substring(0, prefix_hex.length) === prefix_hex) {
            try {
              
              let sql = `SELECT * FROM RAW WHERE hash = ?`;
              const already_hash = await new Promise((_ok) => {
                db.get(sql, [ts.hash], (err, row: any) => {
                  if(row){
                    // console.log(row)
                    _ok(true)
                  }else{
                    _ok(false)
                  }
                })
              })
              if(already_hash){
                // console.log('already_hash ',ts.hash, new Date((+ts.timeStamp) * 1000).toLocaleString())
                continue
              }
              const str = hexToString(ts.input.substring(prefix_hex.length, ts.input.length));
              const json = JSON.parse(str) as baseJsonType;
              if (json && (json?.p.toLocaleLowerCase() === 'base-20')) {
                await new Promise((transctionOk) => {
                  db.serialize(async () => {
                    db.run('BEGIN TRANSACTION;');
                    await InsertRaw(ts, str)
                    await InsertBase(ts, json)
                    await db.run('COMMIT TRANSACTION;', (res, err)=>{
                      if(err){
                        console.log('commit err res', err, res)
                        return
                      }
                      transctionOk('')
                    });
                  })
                })
              } else if (json && (json?.p.toLocaleLowerCase() === 'base-721')) {
                await new Promise((transctionOk) => {
                  db.serialize(async () => {
                    db.run('BEGIN TRANSACTION;');
                    const insertStr = str.length < 1500 ? str : ''
                    await InsertRaw({
                      ...ts,
                      input: ''
                    }, insertStr)
                    await Insert721(ts, json as unknown as base721JsonType)
                    // console.log('COMMIT TRANSACTION;')
                    await db.run('COMMIT TRANSACTION;', (res, err)=>{
                      if(err){
                        console.log('commit err res', err, res)
                        return
                      }
                      transctionOk('')
                    });
                  })
                })
              } else {
                console.log("error json");
              }
            } catch (error) {
              console.log("error, handleResult  parse 006", error, ts.hash);
            }
          } else {
          }
        }
        if(lastBlock){
          ok(lastBlock);
        }
      }else{
        console.log('satus error', data)
        ok('');
      }
    } else {
      console.log("error fetch error", data?.status);
      ok('');
    }
    // not match
    ok('');
  });
};
