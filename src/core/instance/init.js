/* @flow */

import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initLifecycle, callHook } from './lifecycle'
import { mergeOptions } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {          // vue初始化  执行的第一个函数
    const vm: Component = this                                //这里的this  应该是指的是Vue.prototype，  那么  vm = Vue.prototype
    // a uid
    vm._uid = uid++
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {                     // 判断有没有已经使用过了_isComponent这个属性，因为内部要使用 ，怕被占用了
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(                              //第一步要做的是 使用策略对象合并参数选项。 el 选项会使用 defaultStrat 默认策略函数处理，，data 选项则会使用 strats.data 策略函数处理
        resolveConstructorOptions(vm.constructor),           // Vue.options   （如果定义了super可能会 对options进行修改）
        options || {},                                        //  options        是我们调用Vue传入的options
        vm                                                    // Vue.prototype == this
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    callHook(vm, 'beforeCreate')
    initState(vm)
    callHook(vm, 'created')
    initRender(vm)
  }
}

function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  opts.parent = options.parent
  opts.propsData = options.propsData
  opts._parentVnode = options._parentVnode
  opts._parentListeners = options._parentListeners
  opts._renderChildren = options._renderChildren
  opts._componentTag = options._componentTag
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {      //传入的是Vue
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = Ctor.super.options
    const cachedSuperOptions = Ctor.superOptions
    const extendOptions = Ctor.extendOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed
      Ctor.superOptions = superOptions
      extendOptions.render = options.render
      extendOptions.staticRenderFns = options.staticRenderFns
      extendOptions._scopeId = options._scopeId
      options = Ctor.options = mergeOptions(superOptions, extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}



/*
* // 在 Vue.prototype._init 中添加的属性 		**********************************************************
     this._uid = uid++
     this._isVue = true
     this.$options = {
       components,
       directives,
       filters,
       _base,
       el,
       data: mergedInstanceDataFn()
     }
     this._renderProxy = this
     this._self = this

// 在 initLifecycle 中添加的属性		**********************************************************
     this.$parent = parent
     this.$root = parent ? parent.$root : this

     this.$children = []
     this.$refs = {}

     this._watcher = null
     this._inactive = false
     this._isMounted = false
     this._isDestroyed = false
     this._isBeingDestroyed = false

// 在 initEvents	 中添加的属性	 	**********************************************************
     this._events = {}
     this._updateListeners = function(){}

// 在 initState 中添加的属性		**********************************************************
     this._watchers = []
// initData
    this._data

// 在 initRender	 中添加的属性 	**********************************************************
     this.$vnode = null // the placeholder node in parent tree
     this._vnode = null // the root of the child tree
     this._staticTrees = null
     this.$slots
     this.$scopedSlots
     this._c
     this.$createElement
* */