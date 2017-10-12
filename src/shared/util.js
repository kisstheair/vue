/* @flow */

/**
 * Convert a value to a string that is actually rendered.
 */
export function _toString (val: any): string {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
export function toNumber (val: string): number | string {
  const n = parseFloat(val, 10)
  return (n || n === 0) ? n : val
}

/**
 * Make a map and return a function for checking if a key            制造一个map，保存初始值，来对比下次传入的值是否已经有了。
 * is in that map.                                                    构建功能性函数的函数，  根据传入的值生成一个对象，  当生成的函数执行的时候，传入的值和对象中的数对比，有则返回true。
 */
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {                           //泛型的用法，  返回值是一个函数，  这个函数的传入值是字符串
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

/**
 * Check if a tag is a built-in tag.
 */
export const isBuiltInTag = makeMap('slot,component', true)        // 返回的是一个函数isBuiltInTag，  这个函数 传入 solt  会返回true， 传入没有的返回 undefined

/**
 * Remove an item from an array                                       // 把元素从数组中移除
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty                // 检测 是自己的属性，还是原型上的属性。
export function hasOwn (obj: Object, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}      // 判断是不是自己的属性。

/**
 * Check if value is primitive                                         // 判断是不是原始属性，   ECMAScript 有 5 种原始类型（primitive type），即 Undefined、Null、Boolean、Number 和 String。
 */
export function isPrimitive (value: any): boolean {
  return typeof value === 'string' || typeof value === 'number'
}

/**
 * Create a cached version of a pure function.                      // 制造的是一个个缓存系统 的函数。   制造出来的函数 传入一个值 处理一下，备份之后再返回，  下次在用到 先查询备份的有没有。
 */
export function cached (fn: Function): Function {
  const cache = Object.create(null)
  return function cachedFn (str: string): any {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

/**
 * Camelize a hyphen-delmited string.                                  // 把横线分隔的转换为驼峰函数。camelize（a-b-c） 返回ABC  然后缓存起来。
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.                                                  // 首字符大写
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.                                        // 把驼峰式写法 转换为  连字符写法。
 */
const hyphenateRE = /([^-])([A-Z])/g
export const hyphenate = cached((str: string): string => {
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase()
})

/**
 * Simple bind, faster than native                                      // 创建在指定环境中运行的 函数   ，
 */
export function bind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l: number = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
  // record original fn length
  boundFn._length = fn.length
  return boundFn
}

/**
 * Convert an Array-like object to a real Array.
 */
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
export function isObject (obj: mixed): boolean {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
const toString = Object.prototype.toString
const OBJECT_STRING = '[object Object]'
export function isPlainObject (obj: any): boolean {
  return toString.call(obj) === OBJECT_STRING
}

/**
 * Merge an Array of Objects into a single Object.
 */
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/**
 * Perform no operation.
 */
export function noop () {}

/**
 * Always return false.
 */
export const no = () => false

/**
 * Return same value
 */
export const identity = (_: any) => _

/**
 * Generate a static keys string from compiler modules.
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?            判断2个数据是否 一样
 */
export function looseEqual (a: mixed, b: mixed): boolean {
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    return JSON.stringify(a) === JSON.stringify(b)
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

export function looseIndexOf (arr: Array<mixed>, val: mixed): number {       // 判断 一个值在数组中的位置。
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}
