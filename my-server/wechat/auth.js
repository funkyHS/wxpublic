
/*
    验证服务器有效性模块
*/
const sha1 = require('sha1');
const config = require('../config')

module.exports = () => {
    return (req, res, next) => {
        // 微信服务器提交的参数
        console.log("收到参数=>",req.query);
        /*
            signature=4fd2841dbeb325c03b9d6bc6ea2d25a75b82359c&  // 微信的加密签名
            echostr=5925562708760952766& // 微信的随机字符串
            timestamp=1618242232& // 微信的发送请求时间戳
            nonce=1859101214 // 微信的随机数字
        */

        // 1. 将参与微信加密签名的三个参数（timestamp，nonce，token）按照字典序排序并组合在一起形成一个数组
        let {signature,timestamp,nonce,echostr} = req.query;
        let {token} = config;
        let array = [timestamp, nonce, token];
        array.sort();  //字典排序
        // 2. 将数组里所有参数拼接成一个字符串，进行sha1加密
        let str = array.join(''); 
        let resultStr = sha1(str);
        // 3. 加密完成就生成一个signature，和微信发送过来的进行对比
        if(resultStr === signature){
            // 3.1 如果一样，说明消息来自于微信服务器，返回echostr给微信服务器。
            res.set('Content-Type','text/plain')
            res.send(echostr);
        }else{
            // 3.2 如果不一样，说明不是微信服务器发送的消息，返回error
            res.send('Error!!!!!')
        }  
        
    }
}
