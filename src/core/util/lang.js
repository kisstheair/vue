/* @flow */

/**
 * Check if a string starts with $ or _                 检测字符串是不是 以$ ,_ 这两个字符开头的，  是否保留的字符
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.                                   定义一个属性封装一下。
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

/**
 * Parse simple path.                                     解析路径  具体还不知道怎么用。  如果以'.'结尾的返回undefined
 */
const bailRE = /[^\w.$]/
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  } else {
    const segments = path.split('.')                    //  a.b.c  ---   [a,b,c]
    return function (obj) {
      for (let i = 0; i < segments.length; i++) {
        if (!obj) return
        obj = obj[segments[i]]                          // 深层次查找属性
      }
      return obj
    }
  }
}
