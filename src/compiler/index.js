/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'

/**
 * Compile a template.
 */
export function compile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options)            // 解析成抽象语法树
  optimize(ast, options)                                  // 使最优化，使尽可能有效
  const code = generate(ast, options)                     // 构建成 render函数
  return {
    ast,
    render: code.render,                                 // render 执行之后 返回的vnode   返回虚拟 Dom
    staticRenderFns: code.staticRenderFns
  }
}
