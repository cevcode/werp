import * as Ex from "./exceptions";

export function safeGetLen(len, minLen, maxLen) {
    return (!len || len <= minLen) ? minLen : (len > maxLen) ? maxLen : len;
}

/**
 * returns function that returns property value by name
 * @param {Sws.Record|Object} object instance either of Sws.Record or Object
 * @returns {Function}
 */
export function getGetter(object) {
    Ex.raiseErrorIf(!object, "Empty object in getGetter()");

    return (object.get && (typeof object.get === "function")) ?
        (c) => {
            return object.get(c);
        }
        :
        (c) => {
            return object[c];
        };
}

// let _ie;
// let _mac;
// let _safari;
// let _device;

// export class Range {
//     public _start;
//     public _count;

//     constructor(start, count) {
//         this._start = start;
//         this._count = count;
//     }

//     public notEmpty() {
//         return this._count > 0;
//     }

//     public isEmpty() {
//         return !this._count;
//     }
// }

// export function createRange(start, count) {
//     return new Range(start, count);
// }

// export function arrayNullRange(array, start, count) {
//     raiseErrorIf(!isArray(array), "array must be not null");
//     raiseErrorIf(count <= 0, "Count should be greater than 0");

//     const len = array.length;
//     start = start || 0;
//     if (len === 0 || start > len - 1)
//         return util.createRange(start, count);

//     const last = start + count;
//     let lastAvail = last;
//     if (!last || last > len) {
//         lastAvail = len;
//     }

//     let i;
//     for (i = start; i < lastAvail; i++) {
//         if (!array[i]) break;
//     }

//     if (lastAvail !== last) {
//         return util.createRange(i, last - i);
//     }

//     if (i < lastAvail - 1) {
//         for (let j = lastAvail - 1; j >= i; j--) {
//             if (!array[j])
//                 return util.createRange(i, j - i);
//         }
//         raiseError("Should not be there, something wrong with calculations");
//     }
//     // reached end of array, no holes found
//     return util.createRange(start, 0); // all items are not empty
// }

// export function getBetween(value, min, max) {
//     return value < min ? min : value > max ? max : value;
// }

// export function isIe() {
//     if (_ie !== undefined) return _ie;
//     const agent = navigator.userAgent;
//     _ie = agent.indexOf("MSIE ") >= 0 || agent.indexOf("Edge/") > 0 || !!agent.match(/Trident.*rv\:11\./);
//     return _ie;
// }

// export function isMac() {
//     if (_mac !== undefined) return _mac;
//     const agent = navigator.userAgent;
//     _mac = agent.indexOf("Macintosh") >= 0;
//     return _mac;
// }

// export function isSafari() {
//     if (_safari !== undefined) return _safari;
//     const agent = navigator.userAgent;
//     _safari = agent.indexOf("Safari") > -1 && agent.indexOf("Chrom") === -1;
//     return _safari;
// }

// export function getDevice() {
//     if (_device !== undefined) return _device;
//     const agent = navigator.userAgent;
//     if (/(iPhone|iPod|iPad).*AppleWebKit.*Safari/i.test(agent)) {
//         _device = "tablet";
//     } else {
//         _device = null;
//     }
//     return _device;
// }
