/*

access_token: 公众号的全局唯一接口调用凭据，公众号调用各接口时都需使用access_token。
    特点：1. 唯一的
         2. 有效期为2小时，提前5分钟请求
         3. 接口权限，每天2000次
    请求地址：
        https请求方式: GET 
        地址：https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
    设计思路：
        1. 首次本地没有，发送请求获取access_token,保存下来（本地文件）
        2. 第二次或者以后：先去本地读取文件，判断是否过期。
            如果过期，重新请求access_token，保存并覆盖之前的文件
            如果没有过期，可以直接使用

*/


const {appID, appsecret} = require('../config');
var axios = require('axios')
const menu = require('./menu')
const api = require('./api')
var sha1 = require('sha1')
const { writeFileAsync, readFileAsync} = require('./tool')

class Wechat {
    constructor() {}

    // 用来获取 access_token
    async getAccessToken() {
        const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
        let token_data = await axios.get(tokenUrl);
        let res = token_data.data
        console.log(res)
        /*
            { 
                access_token: '44_NWgbQD5ls7aXexxmjDQouhidMBfW2yPmk_7g4xqACLebEX9qcQeP-AOYlnj4MBaY9FY0x3FMqaTZAE0A3GHD3xcIj9xIdtqr4YCTh-UpagKXI1s85vwHJHum0PXggShqjABLiCuydLYFCtddJCPjAGAEXK',
                expires_in: 7200 
            }
        */
        // 设置access_token的过期时间
        res.expires_in = Date.now() + (res.expires_in - 300) * 1000;
        return res
    }

    // 用来保存access_token
    saveAccessToken(accessToken) {
        return writeFileAsync(accessToken,'accessToken.txt');
    }

    // 用来读取access_token
    readAccessToken() {
        return readFileAsync('accessToken.txt');
    }

    // 用来检测access_token是否有效
    isValidAccessToken(data) {
        // 检测传入的参数是否是有效的
        if (!data || !data.access_token || !data.expires_in) {
            return false;
        }
        // 检测access_token是否在有效期内
        return data.expires_in > Date.now()
    }

    // 用来获取没有过期的access_token
    fetchAccessToken() {

        if(this.access_token && this.expires_in && this.isValidAccessToken(this)) {
            // 说明之前保存过access_token，并且它是有效的，直接使用
            return Promise.resolve({
                access_token: this.access_token,
                expires_in: this.expires_in
            })
        }

        return this.readAccessToken()
            .then(async res => {
                // 本地有文件,判断access_token是否过期
                if(this.isValidAccessToken(res)) {
                    return Promise.resolve(res)
                } else {
                    // 过期了
                    const res = await this.getAccessToken();
                    await this.saveAccessToken(res)
                    return Promise.resolve(res)
                }
            })
            .catch(async err => {
                // 本地没有文件
                const res = await this.getAccessToken();
                await this.saveAccessToken(res)
                return Promise.resolve(res)
            })
            .then(res => {
                // 将access_token挂载到this上
                this.access_token = res.access_token;
                this.expires_in = res.expires_in;
                return Promise.resolve(res)
            })
    }




    // 用来获取 jsapi_ticket
    async getTicket() {
        const data = await this.fetchAccessToken()
        const url = `${api.ticket}&access_token=${data.access_token}`
        let res = await axios.get(url);
        return {
            ticket:res.data.ticket, 
            expires_in: Date.now() + (res.data.expires_in - 300) * 1000
        }
    }

    // 用来保存jsapi_ticket
    saveTicket(ticket) {
        return writeFileAsync(ticket,'ticket.txt')
    }

    // 用来读取jsapi_ticket
    readTicket() {
        return readFileAsync('ticket.txt')
    }

    // 用来检测jsapi_ticket是否有效
    isValidTicket(data) {
        // 检测传入的参数是否是有效的
        if (!data || !data.ticket || !data.expires_in) {
            return false;
        }
        // 检测access_token是否在有效期内
        return data.expires_in > Date.now()
    }

    // 用来获取没有过期的jsapi_ticket
    fetchTicket() {

        if(this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
            // 说明之前保存过ticket，并且它是有效的，直接使用
            return Promise.resolve({
                ticket: this.ticket,
                expires_in: this.expires_in
            })
        }

        return this.readTicket()
            .then(async res => {
                // 本地有文件,判断ticket是否过期
                if(this.isValidTicket(res)) {
                    return Promise.resolve(res)
                } else {
                    // 过期了,重新获取ticket
                    const res = await this.getTicket();
                    await this.saveTicket(res)
                    return Promise.resolve(res)
                }
            })
            .catch(async err => {
                // 本地没有文件
                const res = await this.getTicket();
                await this.saveTicket(res)
                return Promise.resolve(res)
            })
            .then(res => {
                // 将ticket挂载到this上
                this.ticket = res.ticket;
                this.ticket_expires_in = res.expires_in;
                return Promise.resolve(res)
            })
    }



    
    row(obj) { //处理数据格式的方法函数
        var keys = Object.keys(obj);
        keys = keys.sort() //字典排序
        var newObj = {};
        keys.forEach((key) => {
            newObj[key.toLowerCase()] = obj[key]
        })
        var string = '';
        for (var k in newObj) {
            string += '&' + k + '=' + newObj[k]
        }
        string = string.substr(1)
        return string;
    }
    // 生成前端页面使用JS-API所需要的配置信息
    async getSignConfig(url) {
        /*
            1，参与签名的字段包括noncestr（随机字符串）, 有效的jsapi_ticket, timestamp（时间戳）, url（当前网页的URL，不包含#及其后面部分） 。
            2，对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，
            3，使用URL键值对的格式（即key1 = value1 & key2=value2…）拼接成字符串string1。这里需要注意的是所有参数名均为小写字符。
            4，对string1作sha1加密，字段名和字段值都采用原始值，不进行URL 转义。
        */

        const {ticket} = await this.fetchTicket()
        const noncestr = Math.random().toString(36).substr(2,15);
        const timestamp = parseInt(new Date().getTime() / 1000) + '';
        var obj = {
            jsapi_ticket:ticket,
            nonceStr:noncestr,
            timestamp:timestamp,
            url
        }
        var str = this.row(obj);
        var signature = sha1(str); //生成签名
        obj.signature = signature;
        obj.appId = appID;
        console.log("------------signObj = \n",obj);
        return obj;  

        
        // const timestamp = Date.now()
        // const {ticket} = await this.fetchTicket()
        // var arr = [
        //     `jsapi_ticket:${ticket}`,
        //     `noncestr:${noncestr}`,
        //     `timestamp:${timestamp}`,
        //     `url=${url}`
        // ]
        // const str = arr.sort().join('&')
        // const signature = sha1(str); //生成签名
        // const obj = {
        //     signature,
        //     noncestr,
        //     timestamp,
        //     url,
        //     appId: appID
        // }
        // console.log("------------signObj = \n",obj);
        // return obj;            
    }




    // 用来创建自定义菜单
    createMenu(menu) {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await this.fetchAccessToken();
                const url = `${api.menu.create}access_token=${data.access_token}`
                let result = await axios.post(url, menu);
                resolve(result)
            } catch (error) {
                reject("createMenu方法出了问题：" + err);
            }
            
        })
    }

    // 用来删除自定义菜单
    deleteMenu() {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await this.fetchAccessToken();
                const url = `${api.menu.delete}access_token=${data.access_token}`
                let result = await axios.get(url);
                resolve(result)
            } catch (error) {
                reject("deleteMenu方法出了问题：" + err);
            }
            
        })
    }
}


// 模拟测试--获取access_token
// const w = new Wechat()
// w.fetchAccessToken().then(res=>{
//     console.log("这里获取到accessToken：",res)
// }).catch(err=>{
//     console.log("获取accessToken失败：",err)
// })

// 模拟测试--删除与创建自定义的菜单
// (async () => {
//     const w = new Wechat();
//     let result = await w.deleteMenu()
//     console.log(result)
//     result = await w.createMenu(menu);
//     console.log(result)
// })()

// 模拟测试--获取jsapi_ticket
// (async () => {
//     const w = new Wechat();
//     let result = await w.fetchTicket()
//     console.log(result)
// })()

// 模拟测试--获取signature
// (async () => {
//     const w = new Wechat();
//     let result = await w.getSignConfig()
//     console.log(result)
// })()


module.exports = Wechat;