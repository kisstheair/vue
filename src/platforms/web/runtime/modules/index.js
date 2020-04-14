import attrs from './attrs'
import klass from './class'
import events from './events'
import domProps from './dom-props'
import style from './style'
import transition from './transition'

export default [                      //  在 vnode---Element 转变的时候，  vnode的值 ---怎么到 Element上面呢？   肯定不能直接用 “.”吧 ，   所以转换完之后要调用这些方法  把 vnode的值用相应的api 配置到Element上面。
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
]
