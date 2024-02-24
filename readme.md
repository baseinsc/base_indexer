

set .env

```
ETH_SCAN_API_KEY=
ETH_SCAN_API_KEY_2=
ETHSACN_BASE_URL=https://api.basescan.org/api
DEX_ADDRESS=0x44439673ad39e252a6b58428f27a1861d623c644
WEB3RPC_KEY=your alchemy key
```


-----

# DOC

## RUN

ts-node  base_indexer_main.ts

ts-node  base_indexer_api.ts


## RPC

BASE RPC: http://127.0.0.1:4000


### Token List

get: /api/base_list?page=1&limit=20

### Token Info

get: /api/tick_info?tick=<token name>

### Token Transaction

get: /api/token_transaction?page=1&limit=20&tick=<token name>


### Monitor

get: /api/base_monitor?page=1&limit=3


### Balance

get: /api/base_balances?addr=


-----

core code: insertBase.ts

# TODO

1:
Balance snapshot, access the account balance of the specified block

Balance snapshots can be more decentralized, allowing markets without the ability to run node nodes to run markets at very low costs.


