

const {parseString} = require('xml2js'); // 命令行安装：npm i xml2js
const {writeFile, readFile} = require('fs') // 引入fs模块
const {resolve} = require('path') // 使用绝对路径，这样保存的文件就都在当前目录下了

module.exports = {

    // 将微信服务器传给开发者服务器的流式的参数拼接成完整数据
    getUserDataAsync (req) {
        return new Promise((resolve,reject) => {
            let xmlData = '';
            req.on('data', data => {
                    // 当流式数据传递过来时，会触发当前时间，会将数据注入到回调函数中
                    // console.log(data.toString());
                    // 读取的数据式buffer，需要将其转化为字符串
                    xmlData += data.toString();
                })
                .on('end', () => {
                    // 当数据接收完毕时，会触发当前
                    resolve(xmlData);
                })
        })
    },

    // 将xml数据解析为js对象
    parseXMLAsync (xmlData) {
        return new Promise((resolve,reject) => {
            parseString(xmlData, {trim: true}, (err, data) => {
                if(!err) {
                    resolve(data);
                } else {
                    reject('parseXMLAsync方法出了问题：' + err)
                }
            })
        })
    },

    // 格式化数据，处理js对象，返回我们想要的数据
    formatMessage(jsData) {
        let message = {};
        // 获取xml对象
        jsData = jsData.xml;
        // 判断数据是否是一个对象
        if(typeof jsData === 'object') {
            for (const key in jsData) {
                const value = jsData[key];
                if (Array.isArray(value) && value.length > 0) {
                    message[key] = value[0]
                }
            }
        }
        return message;
    },

    // 写文件保存到本地
    writeFileAsync (data,fileName) {
        data = JSON.stringify(data)
        const filePath = resolve(__dirname,fileName);
        return new Promise((reslove,reject) => {
            writeFile(filePath, data, err => {
                if (!err) {
                    console.log(fileName+'文件保存成功');
                    reslove();
                } else {
                    reject("writeFileAsync方法出了问题：" + err);
                }
            })
        })
    },

    // 读取本地文件数据
    readFileAsync(fileName) {
        const filePath = resolve(__dirname,fileName);
        return new Promise((reslove,reject) => {
            readFile(filePath,(err,data) => {
                if (!err) {
                    console.log(fileName + '文件读取成功');
                    data = JSON.parse(data)
                    reslove(data);
                } else {
                    reject("readAccessToken方法出了问题：" + err);
                }
            })
        })
    }
}