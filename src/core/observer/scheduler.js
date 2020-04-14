/* @flow */

import type Watcher from './watcher'
import config from '../config'
import {
  warn,
  nextTick,
  devtools
} from '../util/index'

const queue: Array<Watcher> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false                                 //等待时间，  从开始执行到全部刷新结束，
let flushing = false                                //正在刷新状态-----------遍历watcher执行。
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  queue.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  flushing = true

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)                                        //按照id进行排序的

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    const watcher = queue[index]
    const id = watcher.id
    has[id] = null
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > config._maxUpdateCount) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }

  resetSchedulerState()                                                      // 刷新队列之后，重置状态
}

/**
 * Push a watcher into the watcher queue.                                  当data上面的属性触发set方法，dept收集的watch会依次执行， watcher会把自己放到队列中。
 * Jobs with duplicate IDs will be skipped unless it's                      重复ID的作业将被跳过。
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {                       //watcher队列只有一个目的，防止重复的watcher被执行，  当然了，当这个队列全部执行完成之后，会自动清空，   再执行上次出现的watcher是可以的。  （那么就是防止短时间内重复执行watcher）
  const id = watcher.id
  if (has[id] == null) {                         //如果队列中不存在这个watcher，插入进去，  如果队列正在刷新刚刚刷新过，插入进入，  如果队列中已经又了，那就忽略掉。
    has[id] = true
    if (!flushing) {                                                     // 放入队列而已， 如果还没有刷新，直接放进去， 如果已经开始刷新了  需要排序进去。
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.     ------ 如果按照id排序已经过去了，那就直接执行，   如果还没到那就按照排序插入到位置。
      let i = queue.length - 1
      while (i >= 0 && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(Math.max(i, index) + 1, 0, watcher)         // watcher 是按照id进行排序的 。
    }
    // queue the flush           开始刷新队列。
    if (!waiting) {
      waiting = true
      nextTick(flushSchedulerQueue)
    }
  }
}
