/* @flow */

import * as nodeOps from 'web/runtime/node-ops'                    // 是创建实际的 html node 的方法。
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'                     //[ref:{create:fn, uptate:fn, destory:fn},directives :{create:fn, uptate:fn, destory:fn}]
import platformModules from 'web/runtime/modules/index'              // vnode 属性操作的方法。操作[attrs :{create:fn,,} class even]

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)                    // [attrs:{create:fn,uptade:fn,,,}]

export const patch: Function = createPatchFunction({ nodeOps, modules })




/**
 *
 *

 baseModules :包括下面的2个
 [
 		ref:{create:fn, uptate:fn, destory:fn},
   		directives :{create:fn, uptate:fn, destory:fn}
   ]
 平台 platformModules ，包括下面的6个
	[
		attrs: {create:fn, uptate:fn, destory:fn},
		klass: {create:fn, uptate:fn, destory:fn},
		events: {create:fn, uptate:fn, destory:fn},
		domProps: {create:fn, uptate:fn, destory:fn},
		style: {create:fn, uptate:fn, destory:fn},
		transition: {create:fn, uptate:fn, destory:fn}
	]


  modules 是上面的合并结果  总共8个------------------------------干嘛用了呢？
 																	先合并成钩子数组  [create:{cb1,cb2,,,,},  update:{cb1,cb2,,,,},  ]
 																	创建元素之后vnode -Ele， invokeCreateHooks          执行钩子函数中调用     （每次vnode--生成Ele之后 都会调用一次）
 																	销毁元素之前， removeAndInvokeRemoveHook ，invokeDestroyHook    执行钩子函数中调用


 */