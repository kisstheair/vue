/* @flow */

import { namespaceMap } from 'web/util/index'

export function createElement (tagName: string, vnode: VNode): Element {                   // vnode 转化为 html 的element 的方法   创建一个普通的element
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  if (vnode.data && vnode.data.attrs && 'multiple' in vnode.data.attrs) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

export function createElementNS (namespace: string, tagName: string): Element {            // 创建带有命名空间的  element 只针对  xml
  return document.createElementNS(namespaceMap[namespace], tagName)
}

export function createTextNode (text: string): Text {                                                //创建一个 text 节点
  return document.createTextNode(text)
}

export function createComment (text: string): Comment {
  return document.createComment(text)
}

export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {                     //插入到某个元素的前面
  parentNode.insertBefore(newNode, referenceNode)
}

export function removeChild (node: Node, child: Node) {                                                    //移除子节点
  node.removeChild(child)
}

export function appendChild (node: Node, child: Node) {                                                    //添加子节点
  node.appendChild(child)
}

export function parentNode (node: Node): ?Node {                                                            //找到父节点
  return node.parentNode
}

export function nextSibling (node: Node): ?Node {                                                           //找到弟弟节点
  return node.nextSibling
}

export function tagName (node: Element): string {                                                         // 返回tag名称
  return node.tagName
}

export function setTextContent (node: Node, text: string) {                                              //设置文本内容
  node.textContent = text
}

export function setAttribute (node: Element, key: string, val: string) {                         //  设置element的属性
  node.setAttribute(key, val)
}
