import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'

initGlobalAPI(Vue)                                                //在Vue构造函数上添加静态属性和方法。

Object.defineProperty(Vue.prototype, '$isServer', {            // Vue.prototype 上挂载了 $isServer
  get: isServerRendering
})

Vue.version = '__VERSION__'                                 //在 Vue 上挂载了 version 属性。

export default Vue                                           //到这一步才是真的导出Vue，前面的都是生产文件代码。









/*在 Vue 构造函数上挂载静态属性和方法,  不用生成实例， 随处可以调用  直接Vue.set.....
* // src/core/index.js / src/core/global-api/index.js
 Vue.config
 Vue.util = util
 Vue.set = set
 Vue.delete = del
 Vue.nextTick = util.nextTick
 Vue.options = {
 components: {
 KeepAlive
 },
 directives: {},
 filters: {},
 _base: Vue
 }
 Vue.use
 Vue.mixin
 Vue.cid = 0
 Vue.extend
 Vue.component = function(){}
 Vue.directive = function(){}
 Vue.filter = function(){}

 Vue.prototype.$isServer
 Vue.version = '__VERSION__'
*
*
*
* */