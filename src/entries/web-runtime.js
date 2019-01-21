/* @flow */

import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { devtools, inBrowser, isEdge } from 'core/util/index'
import { patch } from 'web/runtime/patch'
import platformDirectives from 'web/runtime/directives/index'
import platformComponents from 'web/runtime/components/index'
import {
  query,
  isUnknownElement,
  isReservedTag,
  getTagNamespace,
  mustUseProp
} from 'web/util/index'

// install platform specific utils                 安装平台特定的工具
Vue.config.isUnknownElement = isUnknownElement
Vue.config.isReservedTag = isReservedTag
Vue.config.getTagNamespace = getTagNamespace
Vue.config.mustUseProp = mustUseProp

// install platform runtime directives & components    安装平台特定的 指令 和 组件
extend(Vue.options.directives, platformDirectives)    // 默认每一个实例都有的指令             // model,show  （runtime时候）
extend(Vue.options.components, platformComponents)     // 默认每一个vue实例都预先添加的组件   // Transition,TransitionGroup   （runtime时候）

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop        // 打补丁，补漏洞， 这是vue发生改变， 需要更新的时候， 去打补丁

// wrap mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return this._mount(el, hydrating)
}

// devtools global hook
/* istanbul ignore next */
setTimeout(() => {
  if (config.devtools) {
    if (devtools) {
      devtools.emit('init', Vue)
    } else if (
      process.env.NODE_ENV !== 'production' &&
      inBrowser && !isEdge && /Chrome\/\d+/.test(window.navigator.userAgent)
    ) {
      console.log(
        'Download the Vue Devtools for a better development experience:\n' +
        'https://github.com/vuejs/vue-devtools'
      )
    }
  }
}, 0)

export default Vue



// runtime.js 文件主要做了三件事儿：
//
//      1、覆盖 Vue.config 的属性，将其设置为平台特有的一些方法
//      2、Vue.options.directives 和 Vue.options.components 安装平台特有的指令和组件
//      3、在 Vue.prototype 上定义 __patch__ 和 $mount




//  经过这个文件处理之后 Vue 天加的如下

      // // 安装平台特定的utils
      // Vue.config.isUnknownElement = isUnknownElement
      // Vue.config.isReservedTag = isReservedTag
      // Vue.config.getTagNamespace = getTagNamespace
      // Vue.config.mustUseProp = mustUseProp
      // // 安装平台特定的 指令 和 组件
      // Vue.options = {
      //     components: {
      //         KeepAlive,
      //         Transition,
      //         TransitionGroup
      //     },
      //     directives: {
      //         model,
      //         show
      //     },
      //     filters: {},
      //     _base: Vue
      // }
      // Vue.prototype.__patch__
      // Vue.prototype.$mount


