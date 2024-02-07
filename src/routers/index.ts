import BigNumber from "bignumber.js";
import { db } from "../sync/connectDb";
import { MARKET_FREEZE_STATUS, MARKET_LIST_STATUS, getMarketList, insertMarketList } from "../utils/sql";
import { ethers } from "ethers";
import * as dotenv from 'dotenv';
dotenv.config();

const { DEX_ADDRESS } = process.env;

import axios from "axios";
import { getBaseBalance, getBaseBalances } from "../select/balance";

export const handleRouters = (router: any) => {
  router.get("/api/tick_list", async (ctx, next) => {
    const res = await new Promise((ok) => {
      db.all("SELECT * FROM BASE_ERC_tick", [], (err, rows) => {
        if (err) {
          console.log("err,row", err, rows);
        }
        ok(rows);
      });
    });
    ctx.body = JSON.stringify({
      data: res,
    });
  });
  
  router.get("/api/base_list", async (ctx, next) => {
    const tick = ctx.query.tick;
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = (page - 1) * limit;
  
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(DISTINCT LOWER(tick)) as total FROM BASE_ERC_tick', [], (err, row: any) => {
        console.log(err, row)
        if (err) {
          reject(err);
        } else {
          resolve(row?.total);
        }
      });
    });
  
    const data = await new Promise((resolve, reject) => {
      // db.all(`SELECT LOWER(tick), holder, *
      // FROM BASE_ERC_tick
      // GROUP BY LOWER(tick)
      // ORDER BY CAST(time AS INTEGER), 
      //   CASE WHEN amount = 0 THEN 0 ELSE (max / amount) END
      // LIMIT ? OFFSET ?
      db.all(`SELECT LOWER(tick), holder, BASE_ERC_tick.*
      FROM BASE_ERC_tick
      JOIN (
        SELECT rowid, (CAST(amount AS REAL) / CAST(max AS REAL)) AS ratio
        FROM BASE_ERC_tick
        ORDER BY (CAST(amount AS REAL) / CAST(max AS REAL)) DESC, CAST(time AS INTEGER)
      ) AS subquery
      ON BASE_ERC_tick.rowid = subquery.rowid
      ORDER BY subquery.ratio DESC, CAST(time AS INTEGER)
      LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows?.map((e => {
            let data  = e as any
            data.tick = e['LOWER(tick)']
            delete data['LOWER(tick)']
            return data
          })));
        }
      });
    });
  
    ctx.body = {
      total,
      data
    };
  });
  
  router.get("/api/tick_info", async (ctx, next) => {
    const res = await new Promise((ok) => {
      const tick = ctx.query.tick;
      db.get("SELECT * FROM BASE_ERC_tick WHERE tick = ?", [tick], (err, row) => {
        if (err) {
          console.log("err,row", err, row);
        }
        ok(row);
      });
    });
    ctx.body = JSON.stringify({
      data: res,
    });
  });
  
  router.get("/api/token_transaction", async (ctx, next) => {
    const tick = ctx.query.tick;
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = (page - 1) * limit;
  
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM BASE_ERC WHERE tick = ?', [tick], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  
    const data = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM BASE_ERC WHERE tick = ? ORDER BY ID LIMIT ? OFFSET ?', [tick, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      total,
      data
    };
   });

  router.get("/api/base_monitor", async (ctx, next) => {
    const page = parseInt(ctx.query.page) || 1;
    const _limit = parseInt(ctx.query.limit) || 10;
    const limit = _limit > 100 ? 100 : _limit
    const offset = (page - 1) * limit;
  
    const data = await new Promise((resolve, reject) => {
      db.all('SELECT ID, hash, decode_data, timeStamp FROM RAW ORDER BY ID DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      // total,
      data
    };
  });

  router.get("/api/base_search_text", async (ctx, next) => {
    const text = ctx.query.text
    
    const data = await new Promise((resolve, reject) => {
      db.all(`SELECT ID, hash, decode_data, timeStamp, creator FROM RAW WHERE decode_data LIKE  ? ORDER BY ID LIMIT 5`, [`%${text}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      // total,
      data
    };
  });

  router.get("/api/base_domain", async (ctx, next) => {
    const text = ctx.query.text || 1;
  
    const data = await new Promise((resolve, reject) => {
      db.all(`SELECT ID, hash, decode_data, timeStamp FROM RAW WHERE decode_data LIKE ? ORDER BY ID LIMIT 20`, [`%"base-721"%${text}"%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      // total,
      data
    };
  });

  router.get("/api/insc_info", async (ctx, next) => {
    const hash = ctx.query.hash || 1;
  
    const data = await new Promise((resolve, reject) => {
      db.get(`SELECT ID, hash, decode_data, timeStamp, creator FROM RAW WHERE hash = ?`, [hash], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      // total,
      data
    };
  });
  
  router.post("/api/search721", async (ctx, next) => {
    const addr = ctx.request.body.addr
    const page = parseInt(ctx.request.body.page) || 1;
    const _limit = parseInt(ctx.request.body.limit) || 10;
    const limit = _limit > 100 ? 100 : _limit
    const offset = (page - 1) * limit;
  
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM BASE_ERC_721_OWNER WHERE owner = ?', [addr] , (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  
    const data = await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT * FROM BASE_ERC_721_OWNER 
          JOIN (
            SELECT hash, decode_data, ID, timeStamp
            FROM RAW
          ) AS RAW ON BASE_ERC_721_OWNER.hash = RAW.hash
          WHERE BASE_ERC_721_OWNER.owner = ? 
          ORDER BY ID DESC LIMIT ? OFFSET ?`, [addr, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      total,
      data
    };
  });

  router.post("/api/insc_owner", async (ctx, next) => {
    const hash = ctx.request.body.hash
    const data = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM BASE_ERC_721_OWNER WHERE hash = ? ', [hash] , (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  
    ctx.body = {
      data
    };
  });

  router.post("/api/insc_op", async (ctx, next) => {
    const hash = ctx.request.body.hash
    const data = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM BASE_ERC_721_TRANSFER_OP WHERE tokenId = ? ', [hash] , (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  
    ctx.body = {
      // total,
      data
    };
  });

  router.post("/api/721", async (ctx, next) => {
    // const addr = ctx.request.body.addr
    const page = parseInt(ctx.request.body.page) || 1;
    const _limit = parseInt(ctx.request.body.limit) || 10;
    const limit = _limit > 100 ? 100 : _limit
    const offset = (page - 1) * limit;
  
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM BASE_ERC_721_OWNER', [] , (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  
    const data = await new Promise((resolve, reject) => {
      db.all(`SELECT DISTINCT * FROM BASE_ERC_721_OWNER 
          JOIN (
            SELECT hash, decode_data, ID, timeStamp
            FROM RAW
          ) AS RAW ON BASE_ERC_721_OWNER.hash = RAW.hash
          ORDER BY ID DESC LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      total,
      data
    };
  });
  
  router.get("/api/token_holders", async (ctx, next) => {
    const tick = ctx.query.tick;
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = (page - 1) * limit;
  
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM balances WHERE tick = ? AND balance > 0', [tick], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.total);
        }
      });
    });
  
    const data = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM balances WHERE tick = ? AND balance > 0 ORDER BY balance DESC LIMIT ? OFFSET ?', [tick, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  
    ctx.body = {
      total,
      data
    };
  });
  
  router.get("/api/base_balance", async (ctx, next) => {
    const addr = ctx.query.addr;
    const tick = ctx.query.tick;
    const res = await getBaseBalance(addr as string, tick as string);
    ctx.body = JSON.stringify({
      data: new BigNumber(res).div(1e8).toFormat(4, BigNumber.ROUND_DOWN),
    });
  });
  
  router.get("/api/base_holder", async (ctx, next) => {
    const tick = ctx.query.tick;
    if(!tick){
      return ctx.body = 'error'
    }
    
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM balances WHERE tick = ? AND balance > 0', [tick], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row?.total);
        }
      });
    });
    ctx.body = JSON.stringify({
      total,
    });
  });
  
  router.get("/api/base_send_list", async (ctx, next) => {
    const addr = ctx.query.addr;
    
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM BASE_ERC WHERE afrom = ?', [addr.toLocaleLowerCase()], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
    const data = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM BASE_ERC WHERE afrom = ?", [addr.toLocaleLowerCase()], (err,rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    })
    ctx.body = {
      total,
      data
    };
  });

  router.get("/api/base_balance_change_list", async (ctx, next) => {
    const addr = ctx.query.addr;
    const tick = ctx.query.tick;
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const total = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM BASE_ERC_BALANCE_ALL_OP WHERE (creator = ? OR to_address = ? OR from_address = ?) AND tick = ?', [
        addr.toLocaleLowerCase(), 
        addr.toLocaleLowerCase(), 
        addr.toLocaleLowerCase(), 
        tick
      ], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
    const data = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM BASE_ERC_BALANCE_ALL_OP WHERE 
      (creator = ? OR to_address = ? OR from_address = ?) 
      AND tick = ? ORDER BY time DESC LIMIT ? OFFSET ?`, [
        addr.toLocaleLowerCase(), addr.toLocaleLowerCase(),  addr.toLocaleLowerCase(), 
        tick, limit, offset
      ], (err,rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    })
    ctx.body = {
      total,
      data
    };
  });
  
  router.get("/api/base_balances", async (ctx, next) => {
    const addr = ctx.query.addr;
    const res = await getBaseBalances(addr as string);
    ctx.body = JSON.stringify({
      data: res?.map(row => {
        return {
          ...row,
          balance: new BigNumber(row.balance).div(1e8).toFormat(4, BigNumber.ROUND_DOWN)
        }
      }),
    });
  });
   
}
