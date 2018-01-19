/* @flow */

import Watcher from '../observer/watcher'
import { createEmptyVNode } from '../vdom/vnode'
import { observerState } from '../observer/index'
import { warn, validateProp, remove, noop } from '../util/index'
import { resolveSlots } from './render'
import { updateComponentListeners } from './events'

export let activeInstance: any = null

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._mount = function (
    el?: Element | void,
    hydrating?: boolean
  ): Component {
    const vm: Component = this
    vm.$el = el
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode
      if (process.env.NODE_ENV !== 'production') {
        /* istanbul ignore if */
        if (vm.$options.template && vm.$options.template.charAt(0) !== '#') {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'option is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          )
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          )
        }
      }
    }
    callHook(vm, 'beforeMount')                            // 触发 beforeMount 生命周期钩子
    vm._watcher = new Watcher(vm, () => {                  // 内部的Watcher收集变量，    vm._render()渲染成虚拟DOM     vm._update将虚拟DOM中的最后一步：patch到DOcument中
      vm._update(vm._render(), hydrating)                  // update()中没有触发 data.get  ,  那么必须render()中触发了get，  否则不会被Dept收集
    }, noop)                                               // new Watcher() 是新检测一个属性，然后执行回调，  然而这里的回调是noop 显然这里不是为了响应的。  vm._update已经完成了所有了呀？  这里用Watcher有什么用呢？
    hydrating = false
    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {                              // 如果是第一次mount则触发 mounted 生命周期钩子
      vm._isMounted = true
      callHook(vm, 'mounted')
    }
    return vm
  }

  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate')
    }
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const prevActiveInstance = activeInstance
    activeInstance = vm
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
                                                                          // initial render   如果还没有 prevVnode 说明是首次渲染，直接创建真实DOM。
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      )
    } else {
                                                                              // updates   说明不是首次渲染，那么就采用 patch 算法进行必要的DOM操作。
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    activeInstance = prevActiveInstance
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    if (vm._isMounted) {
      callHook(vm, 'updated')
    }
  }

  Vue.prototype._updateFromParent = function (
    propsData: ?Object,
    listeners: ?Object,
    parentVnode: VNode,
    renderChildren: ?Array<VNode>
  ) {
    const vm: Component = this
    const hasChildren = !!(vm.$options._renderChildren || renderChildren)
    vm.$options._parentVnode = parentVnode
    vm.$vnode = parentVnode // update vm's placeholder node without re-render
    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode
    }
    vm.$options._renderChildren = renderChildren
    // update props
    if (propsData && vm.$options.props) {
      observerState.shouldConvert = false
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = true
      }
      const propKeys = vm.$options._propKeys || []
      for (let i = 0; i < propKeys.length; i++) {
        const key = propKeys[i]
        vm[key] = validateProp(key, vm.$options.props, propsData, vm)
      }
      observerState.shouldConvert = true
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = false
      }
      vm.$options.propsData = propsData
    }
    // update listeners
    if (listeners) {
      const oldListeners = vm.$options._parentListeners
      vm.$options._parentListeners = listeners
      updateComponentListeners(vm, listeners, oldListeners)
    }
    // resolve slots + force update if has children
    if (hasChildren) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context)
      vm.$forceUpdate()
    }
  }

  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
  }
}

export function callHook (vm: Component, hook: string) {
  const handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      handlers[i].call(vm)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
}



/*Vue的调用过程实际就是按照 lifecycle的顺序进行的。

 1、构建数据响应系统，使用 Observer 将数据data转换为访问器属性；将 el 编译为 render 函数，render 函数返回值为虚拟DOM
 2、在 _mount 中对 _update 求值，而 _update 又会对 render 求值，render 内部又会对依赖的变量求值，收集为被求值的变量的依赖，当变量改变时，_update 又会重新执行一遍，从而做到 re-render。

_开头的是内部变量，   $开头的是实例函数


 _init----》initState----》initRender---》$mount----》
 _mount-----》_update-----》_render--|
                                     |
            __patch__《-----vnode《-|


* */