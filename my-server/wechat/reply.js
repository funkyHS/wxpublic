/*
    处理用户发送的消息类型和内容，决定返回不同的内容给用户

    接收普通消息：https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html
    接收事件推送：https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_event_pushes.html
*/

module.exports = message => {

    let options = {
        toUserName: message.FromUserName,
        fromUserName: message.ToUserName,
        createTime: Date.now(),
        msgType: 'text',
    }

    let content = '暗号不对奥～';
    if (message.MsgType === 'text') {
        if (message.Content === '1') { // 全匹配
            content = '你发个1给我干啥子？';
        } else if (message.Content === '2') {
            content = '你发个2给我干啥子？';
        } else if (message.Content.match('爱')) { // 半匹配
            content = '我爱你～';
        }
    } else if (message.MsgType === 'image') {
        // 用户发送图片消息
        options.msgType = 'image';
        options.mediaId = message.MediaId;
        console.log(message.PicUrl);
    } else if (message.MsgType === 'voice') {
        // 用户发送语音消息
        options.msgType = 'voice';
        options.mediaId = message.MediaId;
        console.log(message.Recognition); // 需要“开启语音识别结果”，在“测试号管理”-->“接口权限标表”
    } else if (message.MsgType === 'location') {
        content = `纬度:${message.Location_X} 经度:${message.Location_Y} 缩放大小:${message.Scale} 位置信息:${message.Label}`
    } else if (message.MsgType === 'event') {

        if (message.Event === 'subscribe') { // 用户订阅事件
            content = '终于等到你啦，么么哒～'
            if (message.EventKey) {
                content = '用户扫描带参数的二维码关注事件';
            }
        } else if (message.Event === 'unsubscribe') {
            console.log('用户取关了～')
        } else if (message.Event === 'SCAN') {
            content = '用户已经关注过，再扫描带参数的二维码事件';
        } else if (message.Event === 'LOCATION') {
            content = `纬度:${message.Latitude} 经度:${message.Longitude} 精度:${message.Precision} `
        } else if (message.Event === 'CLICK') {
            content = `您点击了按钮:${message.EventKey}`;
        }
    }
    options.content = content;
    return options;
}