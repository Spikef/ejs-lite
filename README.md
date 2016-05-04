# EJS-Lite

修改自ejs的模板引擎，使用更简单。

JavaScript templates inspired by `ejs`, more easy to use.

## Installation

```bash
$ npm install ejs-lite
```

## Features

  * 直接执行js代码, 使用 `<% %>`
  * Control flow with `<% %>`
  * 输出原始HTML, 使用 `<%= %>`
  * Unescaped raw output with `<%= %>`
  * 输出HTML转义后的普通文本, 使用 `<%- %>`
  * Escaped output with `<%- %>`
  * 对数组或者json对象循环, 使用 `<%~ %>`
  * Loops for array and json with `<%~ %>`
  * if条件判断分支, 使用 `<%? %>`
  * Add if/else with `<%? %>`
  * switch条件选择,使用 `<%: %>`
  * Add switch case with `<%: %>`
  * 删除下面的空行, 使用 `-%>` 或者 `=%>` 作为结束标签
  * Newline-trim mode ('newline slurping') with `-%>` or `=%>` ending tag
  * 自定义所有的符号, 例如使用'{{ }}'代替'<% %>'
  * Custom delimiters (e.g., use '{{ }}' instead of '<% %>')
  * 包含子模板
  * Includes sub template
  * 支持模板缓存, 减少编译次数
  * Static caching of templates

## Compared with ejs

  * 增加了数组和json的循环, if条件判断分支和switch条件选择的符号
  * Add support for loops/if/switch
  * 所有的特殊标签全部可以自定义
  * All tags are customizable
  * 支持 [NodeAsp](http://nodeasp.com) 引擎
  * Support [NodeAsp](http://nodeasp.com) engine
  * 删除了对 `<%_ _%>` 标签的支持
  * Removed the `<%_ _%>` tag
  * 删除了 `client/strict/_with/rmWhitespace` 等选项
  * Removed the `client/strict/_with/rmWhitespace` options
  * 删除的特殊也许会在足够的测试之后重新添加回来
  * The removed features may be added again after enough testing

## Example

```html
<%?user%>
  <h2><%= user.name %></h2>
<%?%>

// you can still use this
<% if (user) { %>
  <h2><%= user.name %></h2>
<% } %>
```

## Usage

```javascript
var ejs = require('ejs-lite');

var template = ejs.compile(str, options);
template(data);
// => Rendered HTML string

ejs.render(path, data, options);
// => Rendered HTML string

options.filename = path;
ejs.render(options, data);
// => Rendered HTML string
```

## Options

  - `cache`               编译方法(node/io.js)或者方法的构造函数字符串(asp)将被缓存, 默认为false
  - `cache`               Compiled functions are cached, defaults to `false`
  - `filename`            模板文件的完整路径, 如果指定了 template 参数, 则使用 template 参数
  - `filename`            The template file's full name, use the template argument if you specified
  - `encoding`            模板文件的编码(utf8, gbk, gb2312...), 默认为utf8
  - `encoding`            Template file's encoding(utf8, gbk, gb2312...),  defaults to `utf8`
  - `context`             模板编译方法的this指针, 默认为null
  - `context`             Function execution context, defaults to `null`
  - `debug`               是否开启模板调试, 开启之后会在发生错误时指出错误的行号, 默认为true
  - `debug`               When `false` no debug instrumentation is compiled,  defaults to `true`
  - `useWith`             是否使用`with() {}`, 如果设置为false则所有数据都存储在locals对象上, 默认为true
  - `useWith`             Whether or not to use `with() {}` constructs. If false then the locals will be stored in the locals object, defaults to `true`
  - `localsName`          当不使用`with`时, 变量存储对象的对象名称, 默认为`locals`
  - `localsName`          Name to use for the object storing local variables when not using with Defaults to locals
  - `delimiters`          所有界定标签所使用的符号, 详见下面的 `Tags` 章节
  - `delimiters`          Characters to use for delimiter tags, see `Tags` below
    - `delimiters.begin`  `<%`
    - `delimiters.close`  `%>`
    - `delimiters.equal`  `=`
    - `delimiters.plain`  `-`
    - `delimiters.loops`  `~`
    - `delimiters.check`  `?`
    - `delimiters.shift`  `:`
    - `delimiters.notes`  `#`

## Tags

  - `<%`                  普通的代码段, 直接执行, 不输出任何内容
  - `<%`                  'Scriptlet' tag, for control-flow, no output
  - `<%=`                 输出带HTML标签的内容
  - `<%=`                 Outputs the unescaped value into the template
  - `<%-`                 输出转义HTML标签之后的文本
  - `<%-`                 Outputs the value into the template (HTML escaped)
  - `<%#`                 注释标签, 不执行, 也不输出任何内容
  - `<%#`                 Comment tag, no execution, no output
  - `<%~`                 对数组或者json进行循环, 不输出
  - `<%~`                 Loops for array or json, no output
  - `<%?`                 生成if/else/else if代码块, 不输出
  - `<%?`                 Script block for if/else/else if control-flow, no output
  - `<%:`                 生成switch/case/default/break代码块, 不输出
  - `<%:`                 Script block for switch/case/default/break control-flow, no output
  - `<%%`                 输出 '<%'
  - `<%%`                 Outputs a literal '<%'
  - `%>`                  普通的结束标记
  - `%>`                  Plain ending tag
  - `-%> =%>`             结束标记，同时将删除下一个空行
  - `-%> =%>`             Trim-mode ('newline slurp') tag, trims following newline

## Includes

包含子模板与ejs一样, 有两种方式。略微有点不一样的是, template和options.filename两者只要指定其中一个即可。

Includes either have to be an absolute path, or, if not, are assumed as
relative to the template with the `include` call. For example if you are
including `./views/user/show.ejs` from `./views/users.ejs` you would use
`<%= include('user/show') %>`.

You'll likely want to use the raw output tag (`<%=`) with your include to avoid
double-escaping the HTML output.

```html
<ul>
  <% users.forEach(function(user){ %>
    <%= include('user/show', {user: user}) %>
  <% }); %>
</ul>
```

Includes are inserted at runtime, so you can use variables for the path in the
`include` call (for example `<%= include(somePath) %>`). Variables in your
top-level data object are available to all your includes, but local variables
need to be passed down.

NOTE: Include preprocessor directives (`<% include user/show %>`) are
still supported.

## Custom delimiters

所有的标签符号都可以自定义, 不过要注意不要定义了重复的符号.

All delimiters are customizable, but to make sure them different.

```javascript
// index.ejs
{{: users.join(" | "); }}

// index.js
var ejs = require('ejs'),
    users = ['geddy', 'neil', 'alex'];

var delimiters = {
    begin: '{{',
    close: '}}',
    equal: ':',
    shift: '#'    // the shift mark is used for equal, so define another
}

ejs.render('index', {delimiters: delimiters}, {users: users});
// => 'geddy | neil | alex'
```

## Caching

EJS内置了简单的缓存功能(同时支持node和asp), 可以使用其它缓存模块来增进缓存功能.

EJS ships with a basic in-process cache for caching the intermediate JavaScript
functions used to render templates. It's easy to plug in LRU caching using
Node's `lru-cache` library:

```javascript
var ejs = require('ejs')
  , LRU = require('lru-cache');
ejs.cache = LRU(100); // LRU cache with 100-item limit
```

如果需要清除缓存, 直接使用 `ejs.clearCache` 方法.

If you want to clear the EJS cache, call `ejs.clearCache`. If you're using the
LRU cache and need a different limit, simple reset `ejs.cache` to a new instance
of the LRU.

## Layouts

EJS没有支持所谓的模块功能, 但是可以借助include来实现类似功能, 如下所示:

EJS does not specifically support blocks, but layouts can be implemented by
including headers and footers, like so:


```html
<%- include('header') -%>
<h1>
  Title
</h1>
<p>
  My page
</p>
<%- include('footer') -%>
```

## If/else flow

```html
<%var n = 200;%>
<%?n && n>300%><p>大于300</p>
<%??n<100%><p>小于100</p>
<%??%><p>介于100和300之间</p>
<%?%>
```

等同于(is equal to)

```html
<%var n = 200;%>
<%if (n && n>300) {%><p>大于300</p>
<%} else if (n<100) {%><p>小于100</p>
<%} else {%><p>介于100和300之间</p>
<%}%>
```

## Switch/case flow

```html
<%var m = 200;%>
<%:m%>
<%::100%><p>等于100</p>
<%::200, "200"%><p>等于200</p>
<%::%><p>不等于100也不等于200</p>
<%:%>
```

等同于(is equal to)

```html
<%var m = 200;%>
<%switch (m) {%>
  <%case 100:%>
    <p>等于100</p>
    <%break;%>
  <%case 200:%>
  <%case "200":%>
    <p>等于200</p>
    <%break;%>
  <%default:%>
    <p>不等于100也不等于200</p>
    <%break;%>
<%}%>
```

## Loops for array/json

### array

循环标签内部定义的html标签，如示例中的`<ul>`，只有当数组不为空的时候才会显示。
特别地，如果首尾标签完全匹配，可以省略写循环结束时的标签。

在数组循环内部, 可以使用如下几个内部变量:

  - $array:    被循环的数组本身
  - $index:    当前循环的索引
  - $value:    当前循环的值
  - $length:   数组元素个数

examples:

```html
<%
var list = [
              {
                  a: [
                      {val: 1},
                      {val: 2},
                      {val: 3}
                  ]
              },
              {
                  a: [
                      {val: 4},
                      {val: 5}
                  ]
              }
           ];
%>
<%~list <ul>
    <div class="header">header</div>%>
    <li id="out_<%=$index+1%>">
        <%~a <ul>%>
            <li id="in_<%=$index+1%>"><%=val%></li>
        <%~%>
    </li>
<%~</ul>%>

// when useWith === false, use following instead:
<%~list <ul>
    <div class="header">header</div>%>
    <li id="out_<%=$index+1%>">
        <%~$value.a <ul>%>
            <li id="in_<%=$index+1%>"><%=$value.val%></li>
        <%~%>
    </li>
<%~</ul>%>

// =>
<ul>
    <div class="header">header</div>
    <li id="out_1">
        <ul>
            <li id="in_1">1</li>
            <li id="in_2">2</li>
            <li id="in_3">3</li>
        </ul>
    </li>
    <li id="out_2">
        <ul>
            <li id="in_1">4</li>
            <li id="in_2">5</li>
        </ul>
    </li>
</ul>
```

```html
<%
var list = [
               [10, 20, 30],
               [40, 50]
           ];
%>
<%~list <ul>
    <div class="header">header</div>%>
    <li id="out_<%=$index+1%>">
        <%~$value <ul>%>
            <li id="in_<%=$index+1%>"><%=$value%></li>
        <%~%>
    </li>
<%~</ul>%>

// =>
<ul>
    <li id="out_1">
        <ul>
            <li id="in_1">10</li>
            <li id="in_2">20</li>
            <li id="in_3">30</li>
        </ul>
    </li>
    <li id="out_2">
        <ul>
            <li id="in_1">40</li>
            <li id="in_2">50</li>
        </ul>
    </li>
</ul>
```



### json

与数组循环的区别在于，json的循环需要以两个`~~`开始。

在json循环内部, 可以使用如下几个内部变量:

  - $json:     被循环的json本身
  - $key:      当前循环的主键
  - $value:    当前循环的值
  - $length:   json对象一级元素的个数

examples:

```html
<%
var list = {
              a: 100,
              b: 200,
              c: 300
           };
%>
<%~~list <ul>%>
    <li id="<%=$key%>"><%=$value%></li>
<%~%>

// =>
<ul>
    <li id="a">100</li>
    <li id="b">200</li>
    <li id="c">300</li>
</ul>
```

```html
<%
var list = {
               a: {
                   text: 'aaa',
                   value: '111'
               },
               b: {
                   text: 'bbb',
                   value: '222'
               }
           };
%>
<%~~list <ul>
    <div class="header">header</div>%>
    <li id="<%=$key%>">
        <%~~$value <ul>%>
            <li id="<%=text%>"><%=value%></li>
        <%~%>
    </li>
<%~</ul>%>

// when useWith === false, use following instead:
<%~~locals.list <ul>
    <div class="header">header</div>%>
    <li id="<%=$key%>">
        <%~~$value <ul>%>
            <li id="<%=$json.text%>"><%=$json.value%></li>
        <%~%>
    </li>
<%~</ul>%>

// =>
<ul>
    <li id="a">
        <ul>
            <li id="aaa">111</li>
            <li id="aaa">111</li>
        </ul>
    </li>
    <li id="b">
        <ul>
            <li id="bbb">222</li>
            <li id="bbb">222</li>
        </ul>
    </li>
</ul>
```

## Related projects

There are a number of implementations of EJS-Lite:

 * The origin repertory of this library: https://github.com/mde/ejs
 * TJ's implementation, the v1 of this library: https://github.com/tj/ejs
 * Jupiter Consulting's EJS: http://www.embeddedjs.com/
 * EJS Embedded JavaScript Framework on Google Code: https://code.google.com/p/embeddedjavascript/
 * Sam Stephenson's Ruby implementation: https://rubygems.org/gems/ejs
 * Erubis, an ERB implementation which also runs JavaScript: http://www.kuwata-lab.com/erubis/users-guide.04.html#lang-javascript

## License

Licensed under the Apache License, Version 2.0
(<http://www.apache.org/licenses/LICENSE-2.0>)