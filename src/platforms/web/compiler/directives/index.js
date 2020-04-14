import model from './model'
import text from './text'
import html from './html'

export default {　　　　　　　　　　　// 这里的指令是平台指令，只有web平台才会有的
  model,                               // compiler时候的指令是，配置解析到template  有v-model 了  该怎么生成AST
  text,
  html
}
