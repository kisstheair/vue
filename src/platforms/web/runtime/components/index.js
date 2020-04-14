import Transition from './transition'
import TransitionGroup from './transition-group'

export default {                      //平台组件，  在 entries/web-runtime.js 中 提前给  Vue.options.components  添加上了组件，     这说明VUe 在生成构造函数中   合并了这些组件，   每一个vm都有的。
  Transition,
  TransitionGroup
}
