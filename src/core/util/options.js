/* @flow */       //   如何合并一个父选项值和一个子选项  的 一些属性和函数。

import Vue from '../instance/index'
import config from '../config'
import { warn } from './debug'
import { set } from '../observer/index'
import {
  extend,
  isPlainObject,
  hasOwn,
  camelize,
  capitalize,
  isBuiltInTag
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle      // 选项覆盖策略是 处理如何合并一个父选项值和一个子选项 的函数
 * how to merge a parent option value and a child option
 * value into the final value.
 */
const strats = config.optionMergeStrategies                    // strats策略   == 选项融合策略。是一个对象{key，function}用来配置 怎么融合的。

/**
 * Options with restrictions
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.    // 递归的  融合两个对象，并返回
 */
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal
  const keys = Object.keys(from)
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {                                           // 如果本来就有这个属性了，那就不覆盖，如果本来没有这个属性， set一下。
      set(to, key, fromVal)
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {     // 如果是2个对象的话 递归一下吧
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data
 */
strats.data = function (                                // data 选项则会使用 strats.data 策略函数处理
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        childVal.call(this),
        parentVal.call(this)
      )
    }
  } else if (parentVal || childVal) {
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm)
        : undefined
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

/**
 * Hooks and param attributes are merged as arrays.  钩子和param属性合并为数组。  生命周期选项的合并策略函数
 */
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

config._lifecycleHooks.forEach(hook => {        // 把钩子函数数组 挂载到 策略上
  strats[hook] = mergeHook
})

/**
 * Assets
 * mergeAssets 合并资产                                      指令(directives)、组件(components)、过滤器(filters)等选项的合并
 * When a vm is present (instance creation), we need to do  当一个vm出现时(实例创建)，我们需要做 构造函数选项，实例选项，父选项之间的三方合并
 * a three-way merge between constructor options, instance
 * options and parent options.                              指令(directives)、组件(components)、过滤器(filters)等选项的合并策略函数为 mergeAssets。
 */
function mergeAssets (parentVal: ?Object, childVal: ?Object): Object {
  const res = Object.create(parentVal || null)
  return childVal
    ? extend(res, childVal)
    : res
}

config._assetTypes.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one another,
 * so we merge them as arrays.                        观察者哈希不应该覆盖另一个，所以我们将它们合并为数组。
 *
 */
strats.watch = function (parentVal: ?Object, childVal: ?Object): ?Object {
  /* istanbul ignore if */
  if (!childVal) return parentVal
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : [child]
  }
  return ret
}

/**
 * Other object hashes.  其他对象散列
 */
strats.props =
strats.methods =
strats.computed = function (parentVal: ?Object, childVal: ?Object): ?Object {
  if (!childVal) return parentVal
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  extend(ret, childVal)
  return ret
}

/**
 * Default strategy.  默认策略
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names  验证组件名称
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    const lower = key.toLowerCase()
    if (isBuiltInTag(lower) || config.isReservedTag(lower)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + key
      )
    }
  }
}

/**
 * Ensure all props option syntax are normalized into the  确保所有的支持选项语法都被规范化为 对象格式
 * Object-based format.
 */
function normalizeProps (options: Object) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  }
  options.props = res
}

/**
 * Normalize raw function directives into object format.    将原始的函数指令规范化为对象格式。
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.    用于实例化和继承的  核心程序
 */
export function mergeOptions (                 //mergeOptions根据融合策略把各个属性都融合到一起。  strats是融合策略的数组，data怎么融合  指令怎么融合，钩子怎么融合，都保存在strats数组中
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }
  normalizeProps(child)
  normalizeDirectives(child)
  const extendsFrom = child.extends
  if (extendsFrom) {
    parent = typeof extendsFrom === 'function'
      ? mergeOptions(parent, extendsFrom.options, vm)
      : mergeOptions(parent, extendsFrom, vm)
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      let mixin = child.mixins[i]
      if (mixin.prototype instanceof Vue) {
        mixin = mixin.options
      }
      parent = mergeOptions(parent, mixin, vm)
    }
  }
  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}


/*



 1、Vue实例常用属性
     （1）数据
           data:Vue 实例的数据对象
           components：Vue实例配置局部注册组件
     （2）类方法
           computed:计算属性
           watch：侦听属性
           filters：过滤器
           methods:Vue实例方法
           render：渲染函数，创建虚拟DOM
     （3）生命周期
         created：在实例创建完成后被立即调用，完成初始化操作
         mounted：el挂载到Vue实例上了，开始业务逻辑操作
         beforeDestroy：实例销毁之前调用
 2、Vue组件
         props:用于接收来自父组件的数据
         template：组件模板




 */

// var vm = new Vue({                                    //Vue的属性主要分为下面几类
//
//     el:'#demo',                                      // 有关DOM的，找到document中的基点，并渲染成虚拟DOM放入
//     template:"",
//     render:function () { },
//     renderError:function () { },
//
//     data: {},                                          // 有关数据的，data是响应数据， prop从父传递的数据  propsData创建实例传递的属性，watch监视，computed计算属性，，，，
//     props:{},
//     propsData:{},
//     computed: {fullName: function () { }},
//     methods: {},
//     watch:{},
//
//
//     directives:{},                                    // 有关资源的， 子组件， 新定义的指令。
//     filters:{},
//     components:{},
//
//
//     beforeCreate:function () {},                     // 钩子函数
//     created:function () {},
//     beforeMount:function () {},
//     mounted:function () {},
//     beforeUpdate:function () {},
//     updated:function () {},
//     beforeDestroy:function () {},
//     destroyed:function () {},
//     activated:function () {},
//     deactivated:function () {},
//
//
//
//     parent:{},                                       // 有关组合的 父子，  新建的融合，继承，
//     mixins:{},
//     extends:{},
//     provide / inject:{},
// });

