/* @flow */

import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initLifecycle, callHook } from './lifecycle'
import { mergeOptions } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {          // 这里只是把 _init函数加到Vue原型对象上面，并没有执行，  vue实例化之后， 执行的第一个函数
    const vm: Component = this                                //这里的this  _init函数执行是在 构造函数中执行的， this._init(options)  所以这里额this 指的是实例对象。
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
        resolveConstructorOptions(vm.constructor),           // vm.constructor指的是构造函数，Vue   （如果定义了super可能会 对options进行修改）
        options || {},                                        //  options   是我们调用Vue传入的options，  新建vue的时候传入的参数，也就是实例自己的参数
        vm                                                    // 是指的实例自己。
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)                                   // 添加代理， 还是不太明白
    } else {
      vm._renderProxy = vm
    }
    // expose real self                            这个目录中的各个模块，都导出2部分 Minxin 和init在构建的时候， 都minxin过了，  在初始化的时候  在这里执行了初始化。
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

export function resolveConstructorOptions (Ctor: Class<Component>) {      //传入的是Vue构造函数
  let options = Ctor.options
  if (Ctor.super) {                                            //vue是可以继承的， 如果是继承过来的， 继承的方式是Vue.extend = function (extendOptions: Object) ，所以多添加了一些option选项，并且构造函数上也有了super属性，指向父
    const superOptions = Ctor.super.options                   //把继承之后的参数，和父的参数合并一下。
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