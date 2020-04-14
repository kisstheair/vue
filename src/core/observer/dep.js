/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)            //收集 watcher
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)     //建立依赖关系， 将本dep 放入 watcher中
    }
  }

  notify () {
    // stablize the subscriber list first
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one         这是全球唯一的，因为可能只有一个watcher 被，，，  在任何时候
// watcher being evaluated at any time.
Dep.target = null                                           //这个式函数属性，只能在函数上使用，不能在实例上使用--------------，函数导入到其他模块使用，但是还是这个函数本身， 所以  这个 target属性是单例的   全局唯一。
const targetStack = []

export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)           //  如果Dep.target 之前就有的话，那就先保存到栈，存储一下，用完之后恢复
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()                        //  用完之后恢复一下。
}
