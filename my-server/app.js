var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = require('./db/connect')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 接收处理所有消息
// const auth = require('./wechat/auth');
// app.use(auth());

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;






/*

1. 微信服务器知道开发者服务器是哪个
  - 测试好管理页面上填写url开发者服务器地址
    - 使用ngrok 内网穿透 将本地端口号开启的服务映射成外网跨域访问的一个网址
    - ngrok http 3000
  - 填写token
    - 参与微信签名加密的一个参数

2. 开发者服务器 - 验证消息是否来自于微信服务器
    目的：计算得出signature微信加密签名，和微信传递过来的signature进行对比，如果一样，说明消息来自于微信服务器，如果不一样，说明不是微信服务器发送的消息
    （1）将参与微信加密签名的三个参数（timestamp，nonce，token）按照字典序排序并组合在一起形成一个数组
    （2）将数组里所有参数拼接成一个字符串，进行sha1加密
    （3）加密完成就生成一个signature，和微信发送过来的进行对比，
        如果一样，说明消息来自于微信服务器，返回echostr给微信服务器。
        如果不一样，说明不是微信服务器发送的消息，返回error

*/