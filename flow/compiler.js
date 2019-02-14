declare type CompilerOptions = {
  warn?: Function; // allow customizing warning in different environments; e.g. node
  expectHTML?: boolean; // only false for non-web builds
  modules?: Array<ModuleOptions>; // platform specific modules; e.g. style; class
  staticKeys?: string; // a list of AST properties to be considered static; for optimization
  directives?: { [key: string]: Function }; // platform specific directives
  isUnaryTag?: (tag: string) => ?boolean; // check if a tag is unary for the platform
  isReservedTag?: (tag: string) => ?boolean; // check if a tag is a native for the platform
  mustUseProp?: (tag: string, attr: string) => ?boolean; // check if an attribute should be bound as a property
  isPreTag?: (attr: string) => ?boolean; // check if a tag needs to preserve whitespace
  getTagNamespace?: (tag: string) => ?string; // check the namespace for a tag
  transforms?: Array<Function>; // a list of transforms on parsed AST before codegen
  preserveWhitespace?: boolean;
  isFromDOM?: boolean;
  shouldDecodeTags?: boolean;
  shouldDecodeNewlines?: boolean;

  // runtime user-configurable
  delimiters?: [string, string]; // template delimiters
}

declare type CompiledResult = {
  ast: ?ASTElement;
  render: string;
  staticRenderFns: Array<string>;
  errors?: Array<string>;
}

declare type CompiledFunctionResult = {
  render: Function;
  staticRenderFns: Array<Function>;
}

declare type ModuleOptions = {
  preTransformNode: (el: ASTElement) => void;
  transformNode: (el: ASTElement) => void; // transform an element's AST node
  postTransformNode: (el: ASTElement) => void;
  genData: (el: ASTElement) => string; // generate extra data string for an element
  transformCode?: (el: ASTElement, code: string) => string; // further transform generated code for an element
  staticKeys?: Array<string>; // AST properties to be considered static
}

declare type ASTModifiers = { [key: string]: boolean }
declare type ASTIfConditions = Array<{ exp: ?string; block: ASTElement }>

declare type ASTElementHandler = {
  value: string;
  modifiers: ?ASTModifiers;
}

declare type ASTElementHandlers = {
  [key: string]: ASTElementHandler | Array<ASTElementHandler>;
}

declare type ASTDirective = {
  name: string;
  rawName: string;
  value: string;
  arg: ?string;
  modifiers: ?ASTModifiers;
}

declare type ASTNode = ASTElement | ASTText | ASTExpression    // ASTNode 有3种类型， 用tpe分别， 1是Element 2是 表达式， 3是text文本

declare type ASTElement = {　　　　　　　　　　　　　　　　　　//抽象语法树（abstract syntax tree或者缩写为AST）
  type: 1;                                                   // 1是Element 2是 表达式， 3是text文本
  tag: string;                                              //　标签名字　　div ,p, h1, span
  attrsList: Array<{ name: string; value: string }>;        // 用正则解析出来最原始的字符串数据，[{name: "id", value: "demo"}]
  attrsMap: { [key: string]: string | null };              // 把上面的原始数据转换一个格式而已{id: "demo"}
  parent: ASTElement | void;
  children: Array<ASTNode>;

  static?: boolean;                                    // 是不是静态元素， 纯文本，
  staticRoot?: boolean;
  staticInFor?: boolean;
  staticProcessed?: boolean;
  hasBindings?: boolean;                           //元素有绑定 也就是说 元素有 V- @ ： 为开头的属性

  text?: string;                                         // 文本内容
  attrs?: Array<{ name: string; value: string }>;       // 这是不必更新的属性，
  props?: Array<{ name: string; value: string }>;      // 这是必须更新的属性，可相应额属性，  和attrs合起来  = 所有属性attrsList，  那些是必须更新的属性呢？在src/platforms/web/util/attrs.js  mustUseProp 定义好的
  plain?: boolean;
  pre?: true;
  ns?: string;

  component?: string;
  inlineTemplate?: true;
  transitionMode?: string | null;
  slotName?: ?string;
  slotTarget?: ?string;
  slotScope?: ?string;
  scopedSlots?: { [name: string]: ASTElement };

  ref?: string;
  refInFor?: boolean;

  if?: string;                                      // if      v-if="isShow === 1" 对应的属性    isShow === 1
  ifProcessed?: boolean;
  elseif?: string;
  else?: true;
  ifConditions?: ASTIfConditions;                 // if表达式容器 {exp："isShow === 1"， block: ASTElement}

  for?: string;                                 // for     v-for="item in SexList " 对应的属性   SexList
  forProcessed?: boolean;
  key?: string;
  alias?: string;                                // 对应的  上面的 item
  iterator1?: string;
  iterator2?: string;

  staticClass?: string;
  classBinding?: string;
  staticStyle?: string;
  styleBinding?: string;
  events?: ASTElementHandlers;
  nativeEvents?: ASTElementHandlers;

  transition?: string | true;
  transitionOnAppear?: boolean;

  directives?: Array<ASTDirective>;

  forbidden?: true;
  once?: true;
  onceProcessed?: boolean;
  wrapData?: (code: string) => string;

  // weex specific
  appendAsTree?: boolean;
}

declare type ASTExpression = {
  type: 2;
  expression: string;
  text: string;
  static?: boolean;
}

declare type ASTText = {
  type: 3;
  text: string;
  static?: boolean;
}

// SFC-parser related declarations

// an object format describing a single-file component.
declare type SFCDescriptor = {
  template: ?SFCBlock;
  script: ?SFCBlock;
  styles: Array<SFCBlock>;
  customBlocks: Array<SFCCustomBlock>;
}

declare type SFCCustomBlock = {
  type: string;
  content: string;
  start?: number;
  end?: number;
  src?: string;
  attrs: {[attribute:string]: string};
}

declare type SFCBlock = {
  type: string;
  content: string;
  start?: number;
  end?: number;
  lang?: string;
  src?: string;
  scoped?: boolean;
  module?: string | boolean;
}
