const fs = require('fs');

export const default_start_block = 2149055

const dir = './db/block';

fs.mkdir(dir, { recursive: true }, (err) => {
  if (err) throw err;
});

export const dbGetBlockLast = async () => {
    return new Promise<string>((ok, reject) => {
        fs.readFile('db/block/lastBlock.txt', 'utf-8', (err, data) => {
            if (err) {
                return reject(err)
            }
            const last = data;
            ok(last)
        });
    })
}
export const dbSetBlockLast = async (data: string) => {
    return new Promise<void>((ok, reject) => {
        fs.writeFile('db/block/lastBlock.txt', data, (err) => {
            if (err) {
                return reject(err)
            }
            ok()
        })
    })
}