/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag, canBeLeftOpenTag } from 'web/compiler/util'

// Regular Expressions for parsing tags and attributes
const singleAttrIdentifier = /([^\s"'<>/=]+)/                  // 单属性标识符   除了（空白符，引号，<> / =）
const singleAttrAssign = /(?:=)/                               //单属性赋值号    =
const singleAttrValues = [
  // attr value double quotes
  /"([^"]*)"+/.source,                                   //属性值， 双引号包括，   其中包含的除了双引号
  // attr value, single quotes
  /'([^']*)'+/.source,                                    //属性值， 单引号包括，，，其中包含的除了单引号
  // attr value, no quotes
  /([^\s"'=<>`]+)/.source                                //属性值，   没有引号
]
const attribute = new RegExp(                          // 组合成属性的正则，可以匹配的结果  AA = 12，  BB = '123', CC = "345"
  '^\\s*' + singleAttrIdentifier.source +
  '(?:\\s*(' + singleAttrAssign.source + ')' +
  '\\s*(?:' + singleAttrValues.join('|') + '))?'
)

// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')'        // 捕获名称
const startTagOpen = new RegExp('^<' + qnameCapture)                //开始标签打开的开始 <....
const startTagClose = /^\s*(\/?)>/                                  // 开始标签的结束  空格>  或者 空格/>
const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>')        // 结束标签 </fwefwer234>
const doctype = /^<!DOCTYPE [^>]+>/i
const comment = /^<!--/
const conditionalComment = /^<!\[/                                   //条件注释  <![CDATA[]]>]]>这是一种， 不需要解析

let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Special Elements (can contain anything)
const isScriptOrStyle = makeMap('script,style', true)
const hasLang = attr => attr.name === 'lang' && attr.value !== 'html'
const isSpecialTag = (tag, isSFC, stack) => {
  if (isScriptOrStyle(tag)) {
    return true
  }
  if (isSFC && stack.length === 1) {
    // top-level template that has no pre-processor
    if (tag === 'template' && !stack[0].attrs.some(hasLang)) {
      return false
    } else {
      return true
    }
  }
  return false
}

const reCache = {}

const ltRE = /&lt;/g
const gtRE = /&gt;/g
const nlRE = /&#10;/g
const ampRE = /&amp;/g
const quoteRE = /&quot;/g

function decodeAttr (value, shouldDecodeNewlines) {
  if (shouldDecodeNewlines) {
    value = value.replace(nlRE, '\n')
  }
  return value
    .replace(ltRE, '<')
    .replace(gtRE, '>')
    .replace(ampRE, '&')
    .replace(quoteRE, '"')
}

export function parseHTML (html, options) {
  const stack = []
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || no
  let index = 0
  let last, lastTag
  while (html) {
    last = html
    // Make sure we're not in a script or style element                     // 排除script,style,textarea三个标签
    if (!lastTag || !isSpecialTag(lastTag, options.sfc, stack)) {
      let textEnd = html.indexOf('<')                             // 是不是以< 开头的，是就是tag， 不是就是文本
      if (textEnd === 0) {                                        // 此时字符串是以<开头        看一看是不是 html标签，如果是的话，截取一下然后 继续循环
        // Comment:
        if (comment.test(html)) {                                 // 包含注释 <!--
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {                                  // 把注释清除掉
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {                       // 清除掉  <![]> 这个样式的
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype)                //  清除掉   <!DOCTYPE >
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        const endTagMatch = html.match(endTag)                  // 结束标签  </>
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[0], endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        const startTagMatch = parseStartTag()        //匹配开始标签，有点复杂，开始标签 可能有很多属性
        if (startTagMatch) {
          handleStartTag(startTagMatch)
          continue
        }
      }

      let text, rest, next
      if (textEnd > 0) {                                           // 此时字符串  不是以<开头  ，那就是文本
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) &&                                 //不是 结束标签，不是开始标签，不是注释标签，不是条件注释标签，的情况下，   把这个<>  删除掉
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text      在纯文本中，要宽恕并把它当作文本对待。   明明以< 开头了 但是呢去不是 tag，所以宽恕他为文本吧
          next = rest.indexOf('<', 1)                               //rest是剪切过文本的， 下面的应该是<开始的，   这里 从 1的位置开始算起，那就匹配下一个<
          if (next < 0) break                                     // 剩下的都是纯文本了， 不考虑 tag了
          textEnd += next
          rest = html.slice(textEnd)                                // 减掉一个tag  <>。那是什么标签呢？           //不是 结束标签，不是开始标签，不是注释标签，不是条件注释标签，的情况下，   把这个<>  删除掉
        }
        text = html.substring(0, textEnd)                           // 这个while 最终 找出所有的text文本，
        advance(textEnd)
      }

      if (textEnd < 0) {
        text = html
        html = ''
      }

      if (options.chars && text) {
        options.chars(text)
      }

    } else {
      var stackedTag = lastTag.toLowerCase()
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      var endTagLength = 0
      var rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (stackedTag !== 'script' && stackedTag !== 'style' && stackedTag !== 'noscript') {
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag('</' + stackedTag + '>', stackedTag, index - endTagLength, index)
    }

    if (html === last && options.chars) {
      options.chars(html)
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()

  function advance (n) {
    index += n
    html = html.substring(n)
  }

  function parseStartTag () {
    const start = html.match(startTagOpen)            //匹配到开始标签的开始 <
    if (start) {
      const match = {                               // 匹配到 tag名字，属性，开始位置，结束位置
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)       //剪切掉<
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {    // 匹配到属性，并且还没到开始标签的结尾 >
        advance(attr[0].length)         //剪切掉属性的长度
        match.attrs.push(attr)         // 属性放到属性数组
      }
      if (end) {
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    let unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag('', lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag('', tagName)
      }
    }

    const unary = isUnaryTag(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash

    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3] }
        if (args[4] === '') { delete args[4] }
        if (args[5] === '') { delete args[5] }
      }
      const value = args[3] || args[4] || args[5] || ''
      attrs[i] = {
        name: args[1],
        value: decodeAttr(
          value,
          options.shouldDecodeNewlines
        )
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, attrs: attrs })
      lastTag = tagName
      unarySlash = ''
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  function parseEndTag (tag, tagName, start, end) {
    let pos
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    if (tagName) {
      const needle = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].tag.toLowerCase() === needle) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (tagName.toLowerCase() === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (tagName.toLowerCase() === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
