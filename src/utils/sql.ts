export const insertBalanceChangeSql = `
INSERT INTO BASE_ERC_BALANCE_ALL_OP 
(
    creator, from_address, to_address, time,
    tick, hash, blockNumber,
    nonce, b, amount
) 
VALUES 
(
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?
)`;
export const insert721ChangeSql = `INSERT INTO BASE_ERC_721_TRANSFER_OP 
(
    creator, from_address, to_address, time,
    tick, tokenId, hash, blockNumber,
    b
) 
VALUES 
(
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?
)`;

// status: list, cancle listed, pending
export enum MARKET_LIST_STATUS {
    list = "list",
    cancle = "cancle",
    pending = "pending",
    listed = "listed",
}

export enum MARKET_FREEZE_STATUS {
    freeze = "freeze",
    thaw = "thaw",
    error = "error",
}

export const insertMarketList = `
INSERT INTO market_list 
(
    tick, creator, nonce, status,
    time, message, sign, ato,
    value, amt
) 
VALUES 
(
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?
)`;

// status: MARKET_FREEZE_STATUS: freeze thaw error
export const insertFreeze_sell = `
INSERT INTO freeze_sell 
(
    tick, buyer, payment, status,
    time, message, sign, seller,
    value, hash, amt
) 
VALUES 
(
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?
)`;

export const insertMarketListed = `
INSERT INTO market_listed
(
    tick, creator, nonce,
    time, message, sign, 
    ato, hash, blockNumber, 
    value, amt
) 
VALUES 
(
    ?, ?, ?, 
    ?, ?, ?,
    ?, ?, ?,
    ?, ?
)`;

// status: list, cancle listed
export const getMarketList = `
SELECT * FROM market_list WHERE creator = ? AND tick = ?`;