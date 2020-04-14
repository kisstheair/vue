/* @flow */

import { extend, genStaticKeys, noop } from 'shared/util'
import { warn } from 'core/util/debug'
import { compile as baseCompile } from 'compiler/index'
import { detectErrors } from 'compiler/error-detector'
import modules from './modules/index'
import directives from './directives/index'
import { isReservedTag, mustUseProp, getTagNamespace, isPreTag } from '../util/index'
import { isUnaryTag } from './util'

const cache: { [key: string]: CompiledFunctionResult } = Object.create(null)

export const baseOptions: CompilerOptions = {               //编译模板的基础参数
  expectHTML: true,
  modules,
  staticKeys: genStaticKeys(modules),
  directives,                               // 解析的时候， 平台可以有哪些指令？ v-html  v-model   v-text
  isReservedTag,                           //  是不是保留标签     web的保留标签是 html,body,base,head,link,meta,style,title，，，所有html标签，  weex的标签 只有div,img,image,input,switch,indicator,list,scroller,cell,template,text,slider,image这么多
  isUnaryTag,                              //  是不是一元标签，自关闭 没有结束符号  web 有area,base,br,col,embed,frame,hr,img                    weex 没有
  mustUseProp,                             // 那些标签必须拥有属性， selected 必须拥有option   input 必须拥有value
  getTagNamespace,                         // 获取标签的命名空间，  web 只有svg  的命名空间是svg ，                                              weex没有
  isPreTag                                 // 是不是 <pre></pre>   这个标签
}

export function compile (
  template: string,
  options?: CompilerOptions
): CompiledResult {
  options = options
    ? extend(extend({}, baseOptions), options)
    : baseOptions
  return baseCompile(template, options)            // 传入 模板 ---返回 {AST ，render函数，}
}

export function compileToFunctions (
  template: string,
  options?: CompilerOptions,
  vm?: Component
): CompiledFunctionResult {
  const _warn = (options && options.warn) || warn
  // detect possible CSP restriction
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production') {
    try {
      new Function('return 1')
    } catch (e) {
      if (e.toString().match(/unsafe-eval|CSP/)) {
        _warn(
          'It seems you are using the standalone build of Vue.js in an ' +
          'environment with Content Security Policy that prohibits unsafe-eval. ' +
          'The template compiler cannot work in this environment. Consider ' +
          'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
          'templates into render functions.'
        )
      }
    }
  }
  const key = options && options.delimiters
    ? String(options.delimiters) + template
    : template
  if (cache[key]) {
    return cache[key]
  }
  const res = {}
  const compiled = compile(template, options)      //编译结果
  res.render = makeFunction(compiled.render)
  const l = compiled.staticRenderFns.length
  res.staticRenderFns = new Array(l)
  for (let i = 0; i < l; i++) {
    res.staticRenderFns[i] = makeFunction(compiled.staticRenderFns[i])
  }
  if (process.env.NODE_ENV !== 'production') {
    if (res.render === noop || res.staticRenderFns.some(fn => fn === noop)) {
      _warn(
        `failed to compile template:\n\n${template}\n\n` +
        detectErrors(compiled.ast).join('\n') +
        '\n\n',
        vm
      )
    }
  }
  return (cache[key] = res)          // 返回编译好的匿名函数 ，并缓存，
}

function makeFunction (code) {
  try {
    return new Function(code)
  } catch (e) {
    return noop
  }
}
