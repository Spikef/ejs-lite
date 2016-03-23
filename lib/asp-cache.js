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

var cache_key = '__ejs_lite_template_cache__';

module.exports = {
    set: function (key, val) {
        Application.Lock();
        Application(cache_key + key) = val;
        Application.Unlock();
    },
    get: function (key) {
        var val;
        Application.Lock();
        val = Application(cache_key + key);
        Application.Unlock();
        return val;
    },
    clear: function () {
        Application.Lock();

        var contents = new Enumerator(Application.Contents);
        contents.forEach(function(key) {
            if (key.indexOf(cache_key) === 0) {
                Application.Contents.Remove(key);
            }
        });

        Application.Unlock();
    }
};