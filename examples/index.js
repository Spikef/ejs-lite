var http = require('http');
var path = require('path');

http.createServer(function(req, res) {
    // 忽略对favicon.ico的请求
    if ( /\/favicon\.ico$/i.test(req.url) ) {
        return;
    }

    var data = {
        user: {
            nick: "小影"
        },
        welcome: "欢迎",
        list1: [
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
        ],
        list2: [
            [10, 20, 30],
            [40, 50]
        ],
        list3: {
            a: 100,
            b: 200,
            c: 300
        },
        list4: {
            a: {
                text: 'aaa',
                value: '111'
            },
            b: {
                text: 'bbb',
                value: '222'
            }
        }
    };

    var file = path.resolve(__dirname, 'templates/index.ejs');
    var options = {
        filename: file,
        delimiters: {
            begin: '{{',
            close: '}}'
        },
        cache: false,
        useWith: false,
        localsName: 'data'
    };

    var ejs = require('ejs-lite');
    var html = ejs.render(data, options);

    //var ejs = require('ejs');
    //var html = ejs.render(data, options);

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
}).listen(8124);

console.log('Server running at http://127.0.0.1:8124/');