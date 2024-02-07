// export function stringToHex(str: string): string {
//     let link = ""
//     for (let i = 0; i < str.length; i++) {
//         link += str.charCodeAt(i).toString(16)
//     }
//     return link
// }
// export function hexToString(str: string): string {
//     if (str.indexOf('0x') === 0) {
//         str = str.slice(2);
//     }
//     let val = "";
//     let len = str.length / 2;
//     for (let i = 0; i < len; i++) {
//         val += String.fromCharCode(parseInt(str.substr(i * 2, 2), 16));
//     }
//     return val;
// }

export function stringToHex(str: string): string {
    var s = Buffer.from(str, 'utf8')
    return s.toString('hex')
}
export function hexToString(hex: string): string {
    return Buffer.from(hex, 'hex').toString()
}