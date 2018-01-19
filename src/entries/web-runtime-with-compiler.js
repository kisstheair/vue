/* @flow */

import Vue from './web-runtime'
import { warn, cached } from 'core/util/index'
import { query } from 'web/util/index'
import { shouldDecodeNewlines } from 'web/util/compat'
import { compileToFunctions } from 'web/compiler/index'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
                                                   //做了2件事  1.覆盖$mount函数      2.挂载compile函数（作用是将template编译为render函数）
const mount = Vue.prototype.$mount               // 缓存了来自 web-runtime.js 的 $mount 方法
Vue.prototype.$mount = function (                // 重写 $mount 方法
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)                            // 根据 el 获取相应的DOM元素

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {                                     // 如果我们没有写 render 选项，那么就尝试将 template 或者 el 转化为 render 函数
    let template = options.template                          //  这里最主要的目的就是生成render函数，如果没有render 那就查看有没有template----根据compileToFunctions  把模板转化为render
    if (template) {                                          //                                    如果template模板都没有  那么查看有没有 el 选项，根据el 生成template = getOuterHTML(el)) 再去使用 compileToFunctions
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      const { render, staticRenderFns } = compileToFunctions(template, {
        warn,
        shouldDecodeNewlines,
        delimiters: options.delimiters                              //分隔符
      }, this)
      options.render = render                                      // 将编译成的 render 函数挂载到 this.$options 属性下
      options.staticRenderFns = staticRenderFns
    }
  }
  return mount.call(this, el, hydrating)                            // 调用已经缓存下来的 web-runtime.js 文件中的 $mount 方法
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
