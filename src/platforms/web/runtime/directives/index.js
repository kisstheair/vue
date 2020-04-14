import model from './model'
import show from './show'

export default {            //平台组件，  在 entries/web-runtime.js 中 提前给  Vue.options.directives  添加上了指令，     这说明VUe 在生成构造函数中   合并了这些指令，   每一个vm都有的。
  model,                       // runtime的指令是  配置生效时候的操作，
  show
}
