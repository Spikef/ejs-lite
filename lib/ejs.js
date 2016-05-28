/**
 * Usage: 修改自ejs的模板引擎，使用更简单。感谢ejs的作者tj和mde。
 * Author: Spikef < Spikef@Foxmail.com >
 * Copyright: Envirs Team < http://envirs.com >
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs'),
    utils = require('./utils'),
    _DEFAULT_ENCODING = 'utf8',
    _DEFAULT_DELIMITERS = {
        begin: '<%',
        close: '%>',
        equal: '=',
        plain: '-',
        notes: '#',
        loops: '~',
        check: '?',
        shift: ':',
        slash: '%'
    },
    _DEFAULT_LOCALS_NAME = 'locals',
    _TRAILING_SEMICOLON = /;\s*$/,
    _UTF_BOM_FLAG = /^\uFEFF/;

// 缓存模块，可以使用其它的缓存模块来代替
exports.cache = utils.cache;

/**
 * 获取include方法引入的子模板的真实路径
 * @param name
 * @param filename
 */
exports.resolveInclude = function(name, filename) {
    var path = require('path'),
        includePath = path.resolve(path.dirname(filename), name),
        ext = path.extname(name);

    if (!ext) includePath += '.ejs';

    return includePath;
};

/**
 * 清空模板缓存
 */
exports.clearCache = function () {
    exports.cache.clear();
};

/**
 * 根据数据渲染模板
 * @param optional {String} template 完整的模板内容
 * @param {Object} data     模板绑定数据
 * @param {Object} options  模板编译选项
 * @returns {String} 模板渲染结果
 */
exports.render = function(template, data, options) {
    data = data || {};
    options = options || {};

    if ( template && typeof template === 'object' ) {
        options = data;
        data = template;

        return handleCache(options)(data);
    }

    return handleCache(options, template)(data);
};

/**
 * 编译模板
 * @param {String} template 完整的模板内容
 * @param {Object} options  模板编译选项
 * @returns {Function}  模板编译方法
 */
exports.compile = function(template, options) {
    var TPL;
    TPL = new Template(template, options);
    return TPL.compile();
};

/**
 * 从文件或者缓存中读取模板文件
 * @param options
 * @param template
 * @returns {*}
 */
function handleCache(options, template) {
    var fn, TPL,
        filename = options.filename,
        hasTemplate = arguments.length > 1;

    if ( options.cache ) {
        if ( !filename ) {
            throw new Error('请指定模板文件：filename');
        }

        fn = exports.cache.get(filename);
        if ( !fn ) {
            if (!hasTemplate) template = readTemplate(filename, options.encoding);
            TPL = new Template(template, options);
            fn = TPL.compile();
            // 如果是node, 则缓存fn; 如果是asp, 则缓存source
            if ( process.release.name === 'nodeasp' ) {
                exports.cache.set(filename, TPL.source);
            } else {
                exports.cache.set(filename, fn);
            }
        } else if ( typeof fn === 'string' ) {
            TPL = new Template('', options);
            TPL.source = fn;
            fn = TPL.compile();
        } else {
            return fn;
        }
    } else {
        if (!hasTemplate) template = readTemplate(filename, options.encoding);
        fn = exports.compile(template, options);
    }

    return fn;
}

/**
 * 读取模板文件
 * @param filename
 * @param encoding
 */
function readTemplate(filename, encoding) {
    if ( !fs.existsSync(filename) ) {
        console.error('找不到指定的模板文件：' + filename);
        return '';
    } else {
        var template = fs.readFileSync(filename, encoding || _DEFAULT_ENCODING);
        return template.replace(_UTF_BOM_FLAG, '');
    }
}

/**
 * 获取被include文件的模板对象
 * @param path
 * @param options
 * @returns {*}
 */
function includeFile(path, options) {
    var opts = utils.shallowCopy({}, options);
    opts.filename = exports.resolveInclude(path, opts.filename);
    return handleCache(opts);
}

/**
* 获取被include文件的js方法.
* @param {String}  path    path for the specified file
* @param {object} options compilation options
* @return {Object}
*/
function includeSource(path, options) {
    var opts = utils.shallowCopy({}, options),
        includePath,
        template;

    includePath = exports.resolveInclude(path, opts.filename);
    template = readTemplate(includePath, options.encoding);

    opts.filename = includePath;
    var TPL = new Template(template, opts);
    TPL.generateSource();
    return {
        source: TPL.source,
        filename: includePath,
        template: template
    };
}

/**
 * 循环数组
 * @param {Object} obj: 被循环对象的属性
 * @param {String} print: 输出字面量的方法
 * @param {Boolean} close: 是否为结束循环
 * @param {Boolean} useWith: 是否使用with
 * @returns {string}: 循环体方法字符串
 */
function repeatList(obj, print, close, useWith) {
    var arr = [],
        name = obj.name,
        tag = obj.tag,
        end = obj.end;

    if (!close) {
        arr = [
            '    ; (function($array, $length, $index, $value){',
            '         for ($index; $index<$length; $index++){',
            '           $value = $array[$index]',
            '           with ($value) {'
        ];
        if (!useWith) arr.pop();
        if (tag) {
            arr.splice(1, 0, '       if ($length) ' + print + '("' + tag + '");');
        }
    } else {
        arr = [
            '           }',
            '         }',
            '     }(' + name + ', ' + name + '.length, 0, null));'
        ];
        if (!useWith) arr.shift();
        if (end) {
            arr.splice(2, 0, '       if ($length) ' + print + '("' + end + '");');
        } else if (tag) {
            tag = closeTags(tag);
            arr.splice(2, 0, '       if ($length) ' + print + '("' + tag + '");');
        }
    }

    return arr.join('\n');
}

/**
 * 循环json
 * @param {Object} obj: 被循环对象的属性
 * @param {String} print: 输出字面量的方法
 * @param {Boolean} close: 是否为结束循环
 * @param {Boolean} useWith: 是否使用with
 * @returns {string}: 循环体方法字符串
 */
function repeatJSON(obj, print, close, useWith) {
    var arr = [],
        name = obj.name,
        tag = obj.tag,
        end = obj.end;

    if (!close) {
        arr = [
            '    ; (function($json, $length, $key, $value){',
            '         for ($key in $json){',
            '           $value = $json[$key]',
            '           with ($value) {'
        ];
        if (!useWith) arr.pop();
        if (tag) {
            arr.splice(1, 0, '       if ($length) ' + print + '("' + tag + '");');
        }
    } else {
        arr = [
            '           }',
            '         }',
            '     }(' + name + ', Object.keys(' + name + ').length, null, null));'
        ];
        if (!useWith) arr.shift();
        if (end) {
            arr.splice(2, 0, '       if ($length) ' + print + '("' + end + '");');
        } else if (tag) {
            tag = closeTags(tag);
            arr.splice(2, 0, '       if ($length) ' + print + '("' + tag + '");');
        }
    }

    return arr.join('\n');
}

/**
 * 自动取html标签的配对结束标签
 * @param tag
 * @returns {string}
 */
function closeTags(tag) {
    var outs = [];
    tag.split(/\\n/).forEach(function(t) {
        var tags = [];
        var matches = t.match(/<(\w+)/g);
        matches && matches.forEach(function(match) {
            tags.push('</' + match.substr(1) + '>');
        });
        for (var i=tags.length-1; i>=0; i--) {
            t = t.replace(/<\w+[^>]*>/, tags[i]);
        }
        outs.unshift(t);
    });

    return outs.join('\\n');
}

/**
 * 重新抛出错误
 * @param {Error}  err      原本的错误对象
 * @param {String} str      错误源码
 * @param {String} filename 模板文件名
 * @param {Number} lineNum  错误行号
 * @static
 */
function rethrow(err, str, filename, lineNum){
    var lines = str.split('\n')
        , start = Math.max(lineNum - 3, 0)
        , end = Math.min(lines.length, lineNum + 3);

    // 错误行上下文
    var context = lines.slice(start, end).map(function (line, i){
        var curr = i + start + 1;
        return (curr == lineNum ? ' >> ' : '    ')
            + curr
            + '| '
            + line;
    }).join('\n');

    // 重新生成错误信息
    err.filename = filename;
    err.message = (filename || 'ejs') + ':'
        + lineNum + '\n'
        + context + '\n\n'
        + err.message;

    throw err;
}

/**
 * 模板引擎核心类
 */
function Template(text, opts) {
    opts = opts || {};
    var options = {};

    options.escape = utils.escapeHTML;
    options.debug = opts.debug !== false;
    options.filename = opts.filename;
    options.delimiters = utils.shallowCopy(_DEFAULT_DELIMITERS, opts.delimiters || {});
    options.delimiters.slash = options.delimiters.begin.charAt(options.delimiters.begin.length - 1);
    options.context = opts.context;
    options.cache = opts.cache || false;
    options.localsName = opts.localsName || _DEFAULT_LOCALS_NAME;
    options.encoding = opts.encoding || _DEFAULT_ENCODING;
    options.useWith = opts.useWith === false ? false : true;

    this.opts = options;
    this.templateText = text;
    this.mode = null;
    this.truncate = false;
    this.currentLine = 1;
    this.source = '';
    this.repeat = [];

    this.regex = this.createRegex();
}

Template.modes = {
    EXECUTE: 'execute',     // 执行代码, 即 <%
    LITERAL: 'literal',     // 注释性标签, 即 <%%
    ESCAPED: 'escaped',     // 转义HTML标签, 即 <%-
    OUTPUTS: 'outputs',     // 原始输出, 即 <%=
    COMMENT: 'comment',     // 注释文本, 即 <%#
    CIRCLES: 'circles',     // 循环列表, 即 <%~
    PROCESS: 'process',     // 条件判断, 即 <%?
    MATCHES: 'matches'      // 条件选择, 即 <%:
};

Template.prototype = {
    createRegex: function () {
        var delimiters = {};
        for (var i in this.opts.delimiters) {
            delimiters[i] = utils.escapeRegExpChars(this.opts.delimiters[i]);
        }

        // '(<%%|<%=|<%-|<%#|<%?|<%:|<%~|<%|%>|-%>|=%>)'
        var str = [
            delimiters.begin + delimiters.slash,
            delimiters.begin + delimiters.equal,
            delimiters.begin + delimiters.plain,
            delimiters.begin + delimiters.notes,
            delimiters.begin + delimiters.check,
            delimiters.begin + delimiters.shift,
            delimiters.begin + delimiters.loops,
            delimiters.begin,
            delimiters.close,
            delimiters.plain + delimiters.close,
            delimiters.equal + delimiters.close
        ].join('|');

        str = '(' + str + ')';

        return new RegExp(str);
    },

    makeup: function () {
        var src,
            opts = this.opts,
            header = '',
            footer = '';

        if (!this.source) {
            this.generateSource();

            header += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
            if (opts.useWith !== false) {
                header += '  with (' + opts.localsName + ' || {}) {' + '\n';
                footer += '  }' + '\n';
            }

            footer += '  return __output.join("");' + '\n';

            this.source = header + this.source + footer;
        }

        if (opts.debug) {
            src = 'var __line = 1' + '\n'
                + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
                + '  , __filename = ' + (opts.filename ? JSON.stringify(opts.filename) : 'undefined') + ';' + '\n'
                + 'try {' + '\n'
                + this.source
                + '} catch (e) {' + '\n'
                + '  rethrow(e, __lines, __filename, __line);' + '\n'
                + '}' + '\n';

            this.source = src;
        }

        return this.source;
    },

    compile: function () {
        var src = this.source || this.makeup(),
            fn,
            opts = this.opts,
            escape = opts.escape;

        try {
            fn = new Function(opts.localsName + ', escape, include, rethrow', src);
        } catch(e) {
            // istanbul ignore else
            if (e instanceof SyntaxError) {
                e.message = '编译ejs模板时发生错误: ' + e.message;
                if (opts.filename) {
                    e.message += '\n    at ' + opts.filename;
                }
            }
            throw e;
        }

        // 返回一个通过源码创建的可调用的方法,并传入data作为locals. 添加一个内部的include方法以执行加载子模板
        return function (data) {
            var include = function (path, includeData) {
                var d = utils.shallowCopy({}, data);
                if (includeData) {
                    d = utils.shallowCopy(d, includeData);
                }
                return includeFile(path, opts)(d);
            };

            return fn.apply(opts.context, [data || {}, escape, include, rethrow]);
        };
    },

    generateSource: function () {
        var self = this,
            matches = this.parseTemplateText(),
            ds = this.opts.delimiters;

        if (matches && matches.length) {
            matches.forEach(function (line, index) {
                var opening,
                    closing,
                    include,
                    includeOpts,
                    includeObj,
                    includeSrc;

                // 当找到开始标记时,同时去匹配结束标记
                if ( line.indexOf(ds.begin) === 0                               // 如果是开始标记
                    && line.indexOf(ds.begin + ds.slash) !== 0) {    // 并且不是 <%%
                    closing = matches[index + 2];
                    if ( !closing || closing.substr(-ds.close.length) !== ds.close ) {
                        closing = matches[index + 1];                           // 代码块结束的情况
                        if ( !closing || closing.substr(-ds.close.length) !== ds.close ) {
                            throw new Error('找不到匹配的结束标签："' + line + '".');
                        } else {
                            self.scanLine(line);                                // 处理代码块结束
                            line = '';
                        }
                    }
                }

                // 编译 `include` 进来的代码
                if ((include = line.match(/^\s*include\s+(\S+)/))) {
                    opening = matches[index - 1];
                    // 必需在非转义模式下,即不能是<%-include()%>
                    if (opening && (opening != ds.begin + ds.plain)) {
                        includeOpts = utils.shallowCopy({}, self.opts);
                        includeObj = includeSource(include[1], includeOpts);
                        if (self.opts.debug) {
                            includeSrc =
                                '    ; (function(){' + '\n' +
                                '        var __line = 1' + '\n' +
                                '        , __lines = ' + JSON.stringify(includeObj.template) + '\n' +
                                '        , __filename = ' + JSON.stringify(includeObj.filename) + ';' + '\n' +
                                '        try {' + '\n' +
                                           includeObj.source + '\n' +
                                '        } catch (e) {' + '\n' +
                                '          rethrow(e, __lines, __filename, __line);' + '\n' +
                                '        }' + '\n' +
                                '    ; }).call(this);' + '\n';
                        }else{
                            includeSrc =
                                '    ; (function(){' + '\n' + includeObj.source +
                                '    ; }).call(this);' + '\n';
                        }

                        self.source += includeSrc;

                        return;
                    }
                }

                self.scanLine(line);
            });
        }

    },

    // 根据分割符对整个模板进行切割
    parseTemplateText: function () {
        var str = this.templateText,
            pat = this.regex,
            result = pat.exec(str),
            arr = [],
            firstPos,
            lastPos;

        while (result) {
            firstPos = result.index;
            lastPos = pat.lastIndex;

            if (firstPos !== 0) {
                arr.push(str.substring(0, firstPos));
                str = str.slice(firstPos);
            }

            arr.push(result[0]);
            str = str.slice(result[0].length);
            result = pat.exec(str);
        }

        if (str) {
            arr.push(str);
        }

        return arr;
    },

    scanLine: function (line) {
        var self = this,
            ds = this.opts.delimiters,
            uw = this.opts.useWith,
            newLineCount;

        function _addOutput() {
            if (self.truncate) {
                // 删除后面的空行
                line = line.replace(/^(?:\r\n|\r|\n)/, '');
                self.truncate = false;
            }

            if (!line || self.startSwitch) {
                return;
            }

            // 保留字面斜杠
            line = line.replace(/\\/g, '\\\\');

            // 转换换行符
            line = line.replace(/\n/g, '\\n');
            line = line.replace(/\r/g, '\\r');

            // 转义双引号
            // - 这将在编译时作为分割符
            line = line.replace(/"/g, '\\"');
            self.source += '    ; __append("' + line + '")' + '\n';
        }

        newLineCount = (line.split('\n').length - 1);

        switch (line) {
            case ds.begin:
                this.mode = Template.modes.EXECUTE;
                break;
            case ds.begin + ds.equal:
                this.mode = Template.modes.OUTPUTS;
                break;
            case ds.begin + ds.plain:
                this.mode = Template.modes.ESCAPED;
                break;
            case ds.begin + ds.loops:
                this.mode = Template.modes.CIRCLES;
                break;
            case ds.begin + ds.notes:
                this.mode = Template.modes.COMMENT;
                break;
            case ds.begin + ds.check:
                this.mode = Template.modes.PROCESS;
                break;
            case ds.begin + ds.shift:
                this.mode = Template.modes.MATCHES;
                break;
            case ds.begin + ds.slash:
                this.mode = Template.modes.LITERAL;
                this.source += '    ; __append("' + line.replace(ds.begin + ds.slash, ds.begin) + '")' + '\n';
                break;
            case ds.close:
            case ds.equal + ds.close:
            case ds.plain + ds.close:
                // 结束注释标签 <%%   %>
                if (this.mode == Template.modes.LITERAL) {
                    _addOutput();
                }

                this.mode = null;
                this.truncate = line.indexOf(ds.close) > 0;
                break;
            default:
                // 根据不同的类型对标签内部的内容进行处理
                if (this.mode) {
                    // 处理JS代码中的行注释，如果内部有'//'且未换行, 添加一个换行符防止后面的HTML内容被注释掉.
                    switch (this.mode) {
                        case Template.modes.EXECUTE:
                        case Template.modes.ESCAPED:
                        case Template.modes.OUTPUTS:
                            if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                                line += '\n';
                            }
                    }
                    switch (this.mode) {
                        // 执行JS代码
                        case Template.modes.EXECUTE:
                            this.source += '    ; ' + line + '\n';
                            break;
                        // 编码html
                        case Template.modes.ESCAPED:
                            this.source += '    ; __append(escape(' +
                                line.replace(_TRAILING_SEMICOLON, '').trim() + '))' + '\n';
                            break;
                        // 条件判断处理
                        case Template.modes.PROCESS:
                            line = line.trim();
                            if ( line.indexOf(ds.check) === 0 ) {
                                // else 或者 else if
                                line = line.substr(1);
                                if ( !line ) {
                                    this.source += '    ; } else {\n';
                                } else {
                                    this.source += '    ; } else if (' + line.replace(_TRAILING_SEMICOLON, '') + ') {\n';
                                }
                            } else {
                                // if 或者 end if
                                if ( !line ) {
                                    this.source += '    ; }\n';
                                } else {
                                    this.source += '    ; if (' + line.replace(_TRAILING_SEMICOLON, '') + ') {\n';
                                }
                            }
                            break;
                        // 条件分支处理
                        case Template.modes.MATCHES:
                            line = line.trim();
                            if ( line.indexOf(ds.shift) === 0 ) {
                                // case 或者 default
                                line = line.substr(1);
                                if ( !line ) {
                                    this.source += '    ;     break;\n';
                                    this.source += '    ;   default:\n';
                                } else {
                                    if (this.startSwitch) {
                                        this.startSwitch = false;
                                    } else {
                                        this.source += '    ;     break;\n';
                                    }
                                    var items = JSON.parse("[" + line + "]");
                                    for (var i=0,len=items.length; i<len; i++) {
                                        this.source += '        case (' + JSON.stringify(items[i]) + '):\n';
                                    }
                                }
                            } else {
                                // switch 或者 end
                                if ( !line ) {
                                    this.source += '    ;     break;\n';
                                    this.source += '    ; }\n';
                                } else {
                                    this.source += '    ; switch (' + line.replace(_TRAILING_SEMICOLON, '')+ ') {\n';
                                    this.startSwitch = true;
                                }
                            }
                            break;
                        // 循环处理
                        case Template.modes.CIRCLES:
                            var args, last, name, tag;

                            if ( args = line.match(/^\s*(?!<)(\S+)\s*([\s\S]*)/) ) {
                                // 开始循环
                                name = args[1];
                                tag = args[2]
                                            .trim()
                                            .replace(/\\/g, '\\\\')
                                            .replace(/\n/g, '\\n')
                                            .replace(/\r/g, '\\r')
                                            .replace(/"/g, '\\"');
                                last = {name: name, tag: tag};
                                this.repeat.push(last);
                                // 判断循环的是否为json
                                if ( args[1].indexOf(ds.loops) === 0 ) {
                                    last.name = name.substr(1);
                                    last.json = true;
                                    this.source += repeatJSON(last, '__append', false, uw) + '\n';
                                } else {
                                    this.source += repeatList(last, '__append', false, uw) + '\n';
                                }
                            } else if ( last = this.repeat.pop() ) {
                                // 结束循环
                                if ( tag = line.match(/^\s*(?=<)[\s\S]*/) ) {
                                    last.end = tag[0]
                                        .replace(/\\/g, '\\\\')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\r/g, '\\r')
                                        .replace(/"/g, '\\"');
                                }
                                if ( last.json ) {
                                    this.source += repeatJSON(last, '__append', true, uw) + '\n';
                                } else {
                                    this.source += repeatList(last, '__append', true, uw) + '\n';
                                }
                            }
                            break;
                        // 输出html
                        case Template.modes.OUTPUTS:
                            this.source += '    ; __append(' +
                                line.replace(_TRAILING_SEMICOLON, '').trim() + ')' + '\n';
                            break;
                        // 注释文本
                        case Template.modes.COMMENT:
                            // Do nothing
                            break;
                        // 转义模式, 直接输出
                        case Template.modes.LITERAL:
                            _addOutput();
                            break;
                    }
                }
                // 如果是普通的HTML字符串,则直接输出
                else {
                    _addOutput();
                }
        }

        if (self.opts.debug && newLineCount) {
            this.currentLine += newLineCount;
            if (!self.startSwitch) {
                this.source += '    ; __line = ' + this.currentLine + '\n';
            }
        }
    }
};