/* @flow */


/**
 *  既然继承就要有主次之分，就要创建一个新的sub, sub ，获取father的功能，且不会影响father的属性，
 *  	所以要创建一个空函数代表sub，
 *
 * */


import config from '../config'
import { warn, mergeOptions } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production') {
      if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        warn(
          'Invalid component name: "' + name + '". Component names ' +
          'can only contain alphanumeric characters and the hyphen, ' +
          'and must start with a letter.'
        )
      }
    }
    const Sub = function VueComponent (options) {                    //创建一个空函数， 照搬Vue上面的属性，   主要就是合并继承的option   extendOptions，  初始化的时候调用自己的init；
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)              //继承所有功能，
    Sub.prototype.constructor = Sub                            // 构造器指向自己
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super                                    // vue可以继承，面向对象的方式，  那么子类就有一个super属性。
    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use
    // create asset registers, so extended classes
    // can have their private assets too.
    config._assetTypes.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }
    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
