/* @flow */

import * as nodeOps from 'web/runtime/node-ops'                    // 是创建实际的 html node 的方法。
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'                     //[ref:{create:fn, uptate:fn},directives :{...}]
import platformModules from 'web/runtime/modules/index'              // vnode 属性操作的方法。操作[attrs :{create:fn,,} class even]

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)                    // [attrs:{create:fn,uptade:fn,,,}]

export const patch: Function = createPatchFunction({ nodeOps, modules })
