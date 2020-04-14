import bind from './bind'
import { noop } from 'shared/util'

export default {                        //这里的指令是基础指令，　所有的节点都可由的指令
  bind,
  cloak: noop
}
