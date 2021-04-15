var express = require('express');
var router = express.Router();
var UserModel = require('../db/models/UserModel')
var sha1 = require('sha1');
var { sign } = require('../wechat/sign')
const Wechat = require('../wechat/wechat')
var config = require('../config')
const { getUserDataAsync, parseXMLAsync, formatMessage } = require('../wechat/tool');
const template = require('../wechat/template')
const reply = require('../wechat/reply')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// 服务器接入验证接口
router.get('/auth', function (req, res) {
  // 微信服务器提交的参数
  console.log("get收到参数=>", req.query);
  let { signature, timestamp, nonce, echostr } = req.query;
  let { token } = config;

  const sha1Str = sha1([timestamp, nonce, token].sort().join(''))
  if (sha1Str === signature) { // 消息来自于微信
    res.set('Content-Type', 'text/plain')
    res.send(echostr);
  } else { // 消息不是来自于微信
    res.send('Error!!!!!')
  }
});

// 微信服务器会将用户发送的数据以POST请求的方式转发到开发者服务器上
router.post('/auth', async function (req, res) {
  // 微信服务器提交的参数
  console.log("post收到参数=>", req.query);
  /*
    { signature: 'acd46a5f8a2bdac8068c075b8707d438df21538e',
      timestamp: '1618300337',
      nonce: '1255424088',
      openid: 'ojKF_6lcSp8cLByurJlNJElwjCjg' }
  */

  let { signature, timestamp, nonce, echostr } = req.query;
  let { token } = config;

  // 1. 判断消息是否来自微信
  const sha1Str = sha1([timestamp, nonce, token].sort().join(''))
  if (sha1Str !== signature) { // 消息不是来自于微信
    res.send('Error!!!!!')
  }

  // 2. 接收请求体中的数据，流式数据
  const xmlData = await getUserDataAsync(req);
  console.log("-------------xmlData:\n",xmlData);
  /*
    <xml>
      <ToUserName><![CDATA[gh_1a3680a1f984]]></ToUserName> // 开发者id
      <FromUserName><![CDATA[ojKF_6lcSp8cLByurJlNJElwjCjg]]></FromUserName> // 用户openid
      <CreateTime>1618305924</CreateTime> // 发送的时间戳
      <MsgType><![CDATA[text]]></MsgType> // 发送的消息类型
      <Content><![CDATA[123]]></Content> // 发送的内容
      <MsgId>23168573006236500</MsgId> // 消息id 微信服务器会默认保存3天用户发送的数据，通过此id三天内就能找到消息数据，三天后就被销毁
    </xml>
  */

  // 3. 将xml数据解析为js对象
  const jsData = await parseXMLAsync(xmlData)
  console.log("-------------jsData:\n",jsData);
  /*
    { xml:
      { ToUserName: [ 'gh_1a3680a1f984' ],
        FromUserName: [ 'ojKF_6lcSp8cLByurJlNJElwjCjg' ],
        CreateTime: [ '1618306482' ],
        MsgType: [ 'text' ],
        Content: [ '123' ],
        MsgId: [ '23168577811529715' ] } }
  */

  // 4. 格式化数据
  const message = formatMessage(jsData)
  console.log("-------------message:\n",message);
  /*
    { ToUserName: 'gh_1a3680a1f984',
      FromUserName: 'ojKF_6lcSp8cLByurJlNJElwjCjg',
      CreateTime: '1618312309',
      MsgType: 'text',
      Content: '123',
      MsgId: '23168664007830650' }
  */

  // 5. 简单的自动回复
  /*
    一旦遇到以下情况，微信都会在公众号会话中，向用户下发系统提示“该公众号暂时无法提供服务，请稍后再试”：
        1、开发者在5秒内未回复任何内容 
        2、开发者回复了异常数据，比如JSON数据，字符串，xml数据中有多余的空格等

    另外，请注意，回复图片（不支持gif动图）等多媒体消息时需要预先通过素材管理接口上传临时素材到微信服务器，
        可以使用素材管理中的临时素材，也可以使用永久素材。
  */

  const options = reply(message);
  console.log("-------------options:\n",options);
  let replyMessage = template(options);
  console.log("-------------replyMessage:\n",replyMessage);

  // 返回响应给微信服务器
  res.send(replyMessage);

  // // 如果开发者服务器没有返回响应给微信服务器，微信服务器会发送三次请求过来
  // res.end('');


});

// 封装方法一
router.get('/wxconfig', async function (req, res) {
  let url = decodeURIComponent(req.query.url);
  const w = new Wechat();
  let conf = await w.getSignConfig(url)
  // let conf = await sign(url);
  console.log('conf', conf)
  res.send(conf);
})


// 封装方法二（千锋视频学习）
router.get('/jsapi', async function (req, res) {
  let url = decodeURIComponent(req.query.url);
  let conf = await sign(url);
  console.log('conf', conf)
  res.send(conf);
});

router.post('/reg', function (req, res) {
  console.log(req.body) //接收前端通过post提交的数据
  let { user, pwd } = req.body;
  // 使用mongoose提供的方法，将user与pwd存储至数据库
  new UserModel({ //一条具体的数据
    user: user,
    pwd: pwd
  }).save().then(() => {
    res.send({ code: 1, msg: '注册成功' })
  })
});




module.exports = router;
