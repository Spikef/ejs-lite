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

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

/**
 * 根据正则表达式对字符串编码.
 * 如果 `string` 为 `undefined` 或者 `null`, 则直接返回空字符串.
 * @param {String} string 输入字符串
 * @return {String} 编码之后的字符串
 */
exports.escapeRegExpChars = function (string) {
    // istanbul ignore if
    if (!string) {
        return '';
    }
    return String(string).replace(regExpChars, '\\$&');
};

var _ENCODE_HTML_RULES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&#34;',
        "'": '&#39;'
    },
    _MATCH_HTML_CHARS = /[&<>'"]/g;

function encode_char(c) {
    return _ENCODE_HTML_RULES[c] || c;
}

/**
 * 转义HTML标签.
 * 如果 `markup` 为 `undefined` 或者 `null`, 则返回空字符串.
 * @param {String} markup Input string
 * @return {String} Escaped string
 */
exports.escapeHTML = function (markup) {
    return markup == undefined
        ? ''
        : String(markup).replace(_MATCH_HTML_CHARS, encode_char);
};

/**
 * 浅拷贝JSON对象.
 * @param  {Object} target   目标对象
 * @param  {Object} source   源对象
 * @return {Object}          目标对象
 */
exports.shallowCopy = function (target, source) {
    source = source || {};
    for (var p in source) {
        target[p] = source[p];
    }
    return target;
};

/**
 * 使用Application对模板进行缓存
 */
if ( process.release.name === 'nodeasp' ) {
    exports.cache = require('./asp-cache');
} else {
    exports.cache = {
        _data: {},
        set: function (key, val) {
            this._data[key] = val;
        },
        get: function (key) {
            return this._data[key];
        },
        clear: function () {
            this._data = {};
        },
        remove: function(key) {
            delete this._data[key]
        }
    };
}

exports.cache.reset = exports.cache.clear;
