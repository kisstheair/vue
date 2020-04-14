/* @flow */

import config from '../config'
import Dep, { pushTarget, popTarget } from './dep'
import { queueWatcher } from './scheduler'
import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set
} from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {                            // 有2中类型    new Watcher （vm，ecp， cb()）        exp可是是a   a.b  a.b.c  那么只getvm的某个数据，所以只对某个数据响应式    -------------- cb是 判断==oldValue 不等的情况擦会cb()
  vm: Component;                                         //               new Watcher （vm，fun()， cb()）      fun() 触发vm的get，  也就是vm的 data  都会进行Dep收集，， 所以针对vm整个data响应
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: Set;
  newDepIds: Set;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: Object
  ) {
    this.vm = vm
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb                                                      //回调
    this.id = ++uid // uid for batching                               //每一个watcher 都有一个id
    this.active = true                                               // 是否激活   也就是是否运行callback的标识
    this.dirty = this.lazy // for lazy watchers                         是不是暂时先不触发回调的
    this.deps = []                                                    //都有那个收集器  收集了这个watcher
    this.newDeps = []                                                 //新添加的
    this.depIds = new Set()                                           //做缓存用的吗？
    this.newDepIds = new Set()                                       //
    this.expression = process.env.NODE_ENV !== 'production'        //
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)                              //  expOrFn可能是a.b.c    返回的是一个可以深层次查找属性的函数       如：expOrFn：a  this.getter = (obj)=》{retuen obj.a}
      if (!this.getter) {
        this.getter = function () {}
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.    评估吸气剂，并重新收集依赖项
   */
  get () {                                                     // 带有防止重复的处理，添加了一次依赖之后，  后面的不会再添加。
    pushTarget(this)
    const value = this.getter.call(this.vm, this.vm)       // expOrFn可能是a.b    传入的是this.vm对象    那么函数执行会查找 this.vm.a     this.vm.a.b ------》触发get属性
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    popTarget()                                            // 恢复到 target 的原来的状态，
    this.cleanupDeps()
    return value
  }

  /**
   * Add a dependency to this directive.                  把dep放入本watcher中，    data 的每一个属性都对应自己的Dep对象，  watcher在查找那一个属性的时候可能触发一串的  get 所以  对应多个Dep
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }                                                    // 响应的时候   会执行这个函数。------然后再调用run------在调用get--------在执行回调cb.call（）

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()                        //为什么要再次调用get()函数呢？
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            /* istanbul ignore else */
            if (config.errorHandler) {
              config.errorHandler.call(null, e, this.vm)
            } else {
              process.env.NODE_ENV !== 'production' && warn(
                `Error in watcher "${this.expression}"`,
                this.vm
              )
              throw e
            }
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed or is performing a v-for
      // re-render (the watcher list is then filtered by v-for).
      if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
const seenObjects = new Set()
function traverse (val: any) {
  seenObjects.clear()
  _traverse(val, seenObjects)
}

function _traverse (val: any, seen: Set) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
