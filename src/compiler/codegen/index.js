/* @flow */

import { genHandlers } from './events'
import { baseWarn, pluckModuleFunction } from '../helpers'
import baseDirectives from '../directives/index'
import { camelize, no } from 'shared/util'

// configurable state
let warn
let transforms
let dataGenFns
let platformDirectives
let isPlatformReservedTag
let staticRenderFns                          // 静态执行函数，不需要数据变动之后重新渲染的
let onceCount
let currentOptions

export function generate (　　　　　　　　　　　　　　　　　　　　　// 解释器， 把AST 解析成  html
  ast: ASTElement | void,
  options: CompilerOptions
): {
  render: string,
  staticRenderFns: Array<string>
} {
  // save previous staticRenderFns so generate calls can be nested
  const prevStaticRenderFns: Array<string> = staticRenderFns
  const currentStaticRenderFns: Array<string> = staticRenderFns = []
  const prevOnceCount = onceCount
  onceCount = 0
  currentOptions = options
  warn = options.warn || baseWarn
  transforms = pluckModuleFunction(options.modules, 'transformCode')
  dataGenFns = pluckModuleFunction(options.modules, 'genData')
  platformDirectives = options.directives || {}                            // 开始的时候平台指令已经放到 Vue.options.directives  ，实例化的时候可能也会添加自定义的指令，  这里是二者的合并。
  isPlatformReservedTag = options.isReservedTag || no
  const code = ast ? genElement(ast) : '_c("div")'
  staticRenderFns = prevStaticRenderFns
  onceCount = prevOnceCount
  return {
    render: `with(this){return ${code}}`,                            //  ${} 是占位符， ``是ES2015的语法，代表的也是就是代码，就是为了方便加占位符的，   例如 console.log(`一共有${a}个鸡蛋！`)      那么`` 执行的时候相当于一个函数了  传入占位符，  js引擎解析一下返回结果
    staticRenderFns: currentStaticRenderFns                           // 那么在这里肯定需要  js引擎解析一下with(this){。。。}    然后返回
  }
}

function genElement (el: ASTElement): string {
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el)
  } else if (el.for && !el.forProcessed) {
    return genFor(el)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return genChildren(el) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el)
  } else {
    // component or element
    let code
    if (el.component) {
      code = genComponent(el.component, el)
    } else {
      const data = el.plain ? undefined : genData(el)

      const children = el.inlineTemplate ? null : genChildren(el, true)
      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data　　　　　　　　　　　　　　　　　　　　　　这里才是调用 ＿C　 createElement 方法，返回的是 一个VNode
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    for (let i = 0; i < transforms.length; i++) {
      code = transforms[i](el, code)
    }
    return code   // VNode
  }
}

// hoist static sub-trees out
function genStatic (el: ASTElement): string {
  el.staticProcessed = true
  staticRenderFns.push(`with(this){return ${genElement(el)}}`)
  return `_m(${staticRenderFns.length - 1}${el.staticInFor ? ',true' : ''})`
}

// v-once
function genOnce (el: ASTElement): string {
  el.onceProcessed = true
  if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else if (el.staticInFor) {
    let key = ''
    let parent = el.parent
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && warn(
        `v-once can only be used inside v-for that is keyed. `
      )
      return genElement(el)
    }
    return `_o(${genElement(el)},${onceCount++}${key ? `,${key}` : ``})`         //_o只是对生成的Vnode进行标记一下，
  } else {
    return genStatic(el)
  }
}

function genIf (el: any): string {
  el.ifProcessed = true // avoid recursion
  return genIfConditions(el.ifConditions.slice())
}

function genIfConditions (conditions: ASTIfConditions): string {
  if (!conditions.length) {
    return '_e()'
  }

  var condition = conditions.shift()
  if (condition.exp) {                             //ast --vdom  如果表达式不为空，  vdom节点需要依赖表达式而存在。
    return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions)}`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {                                      // 这里直接去构建一个普通的元素就好了，el.ifProcessed  = true ，再次的时候会忽略 el.if属性。
    return el.once ? genOnce(el) : genElement(el)
  }
}

function genFor (el: any): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''
  el.forProcessed = true // avoid recursion
  const temp =  `_l((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${genElement(el)}` +
    '})'
	return temp;
}

function genData (el: ASTElement): string {
  let data = '{'

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  const dirs = genDirectives(el)
  if (dirs) data += dirs + ','

  // key
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre
  if (el.pre) {
    data += `pre:true,`
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // module data generation functions
  for (let i = 0; i < dataGenFns.length; i++) {
    data += dataGenFns[i](el)
  }
  // attributes
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},`
  }
  // DOM props
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`
  }
  // event handlers
  if (el.events) {
    data += `${genHandlers(el.events)},`
  }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true)},`
  }
  // slot target
  if (el.slotTarget) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots
  if (el.scopedSlots) {
    data += `${genScopedSlots(el.scopedSlots)},`
  }
  // inline-template
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  data = data.replace(/,$/, '') + '}'
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  return data
}

function genDirectives (el: ASTElement): string | void {
  const dirs = el.directives
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    const gen = platformDirectives[dir.name] || baseDirectives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:"${dir.arg}"` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el: ASTElement): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (
    el.children.length > 1 || ast.type !== 1
  )) {
    warn('Inline-template components must have exactly one child element.')
  }
  if (ast.type === 1) {
    const inlineRenderFns = generate(ast, currentOptions)
    return `inlineTemplate:{render:function(){${
      inlineRenderFns.render
    }},staticRenderFns:[${
      inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
    }]}`
  }
}

function genScopedSlots (slots) {
  return `scopedSlots:{${
    Object.keys(slots).map(key => genScopedSlot(key, slots[key])).join(',')
  }}`
}

function genScopedSlot (key: string, el: ASTElement) {
  return `${key}:function(${String(el.attrsMap.scope)}){` +
    `return ${el.tag === 'template'
      ? genChildren(el) || 'void 0'
      : genElement(el)
  }}`
}

function genChildren (el: ASTElement, checkSkip?: boolean): string | void {
  const children = el.children
  if (children.length) {
    const el: any = children[0]
    // optimize single v-for
    if (children.length === 1 &&
        el.for &&
        el.tag !== 'template' &&
        el.tag !== 'slot') {
      return genElement(el)
    }
    const normalizationType = getNormalizationType(children)
    return `[${children.map(genNode).join(',')}]${
      checkSkip
        ? normalizationType ? `,${normalizationType}` : ''
        : ''
    }`
  }
}

// determine the normalzation needed for the children array.　　　　　	确定子数组所需的规范化。
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full nomralization needed
function getNormalizationType (children): number {
  for (let i = 0; i < children.length; i++) {
    const el: any = children[i]
    if (needsNormalization(el) ||
        (el.if && el.ifConditions.some(c => needsNormalization(c.block)))) {
      return 2
    }
    if (maybeComponent(el) ||
        (el.if && el.ifConditions.some(c => maybeComponent(c.block)))) {
      return 1
    }
  }
  return 0
}

function needsNormalization (el) {                                //需要规范化的元素？
  return el.for || el.tag === 'template' || el.tag === 'slot'
}

function maybeComponent (el) {
  return el.type === 1 && !isPlatformReservedTag(el.tag)
}

function genNode (node: ASTNode) {
  if (node.type === 1) {
    return genElement(node)
  } else {
    return genText(node)
  }
}

function genText (text: ASTText | ASTExpression): string {
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

function genSlot (el: ASTElement): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}`
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent (componentName, el): string {
  const children = el.inlineTemplate ? null : genChildren(el, true)
  return `_c(${componentName},${genData(el)}${
    children ? `,${children}` : ''
  })`
}

function genProps (props: Array<{ name: string, value: string }>): string {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    res += `"${prop.name}":${transformSpecialNewlines(prop.value)},`
  }
  return res.slice(0, -1)
}

// #3895, #4268
function transformSpecialNewlines (text: string): string {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
