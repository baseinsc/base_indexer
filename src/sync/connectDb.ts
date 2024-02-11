import * as sqlite3 from "sqlite3";

const db = global.test ? new sqlite3.Database("db/zerojson_test.db") :  new sqlite3.Database("db/zerojson.db");

export const initDb = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS RAW (
            ID INTEGER  PRIMARY KEY AUTOINCREMENT,
            blockNumber INTEGER,
            decode_data TEXT,
            creator TEXT,
            input TEXT,
            hash TEXT,
            timeStamp TEXT,
            nonce INTEGER
        )`);
        // decimal 0,  transfer to 8 
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC (
            ID INTEGER  PRIMARY KEY AUTOINCREMENT,
            p TEXT,
            op TEXT,
            tick TEXT,
            afrom TEXT,
            amt TEXT,
            max TEXT,
            lim TEXT,
            wlim TEXT,
            dec TEXT,
            ato TEXT,
            hash TEXT,
            blockNumber INTEGER,
            nonce INTEGER
        )`);
        // decimal 0,  transfer to 8 
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC_721 (
            ID INTEGER  PRIMARY KEY AUTOINCREMENT,
            p TEXT,
            op TEXT,
            tick TEXT,
            afrom TEXT,
            tokenId TEXT,
            max TEXT,
            lim TEXT,
            wlim TEXT,
            blim TEXT,
            dec TEXT,
            ato TEXT,
            hash TEXT,
            blockNumber INTEGER,
            nonce INTEGER
        )`);
        // freeze status: freeze | thaw | error
        db.run(`CREATE TABLE IF NOT EXISTS freeze_sell (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            tick TEXT,
            buyer TEXT,
            payment TEXT,
            status TEXT,
            time TEXT,
            message TEXT,
            sign TEXT,
            seller TEXT,
            value TEXT,
            hash TEXT,
            amt TEXT
        )`);
        // decimal 8
        db.run(`
            CREATE TABLE IF NOT EXISTS balances (
                address TEXT,
                tick TEXT,
                balance INTEGER,
                PRIMARY KEY (address, tick)
            )
        `);
        
        // decimal 0
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC_tick (
            tick TEXT PRIMARY KEY,
            amount INTEGER,
            max INTEGER,
            holder TEXT,
            creator TEXT,
            json TEXT,
            last_time TEXT,
            time TEXT
        )`);
        
        // decimal 0
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC_BALANCE_ALL_OP (
            ID INTEGER  PRIMARY KEY AUTOINCREMENT,
            creator TEXT,
            from_address TEXT,
            to_address TEXT,
            time TEXT,
            tick TEXT,
            hash TEXT,
            blockNumber INTEGER,
            nonce TEXT,
            b INTEGER,
            amount INTEGER
        )`);
        
        // decimal 0 token: transferItem.hash
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC_721_TRANSFER_OP (
            ID INTEGER  PRIMARY KEY AUTOINCREMENT,
            creator TEXT,
            from_address TEXT,
            to_address TEXT,
            time TEXT,
            tick TEXT,
            tokenId TEXT,
            hash TEXT,
            blockNumber INTEGER,
            b INTEGER
        )`);

        // decimal 0
        db.run(`CREATE TABLE IF NOT EXISTS BASE_ERC_721_OWNER (
            owner TEXT,
            hash TEXT,
            PRIMARY KEY (hash)
        )`);
    })
}

initDb()

export {
    db
}