/*
    自定义菜单模块
    https://developers.weixin.qq.com/doc/offiaccount/Custom_Menus/Creating_Custom-Defined_Menu.html
*/

module.exports = {
    "button":[
    {	
        "type":"click",
        "name":"点我啊",
        "key":"CLICK"
    },
    {
        "name":"菜单",
        "sub_button":[
            {	
              "type":"view",
              "name":"跳转链接",
              "url":"http://www.ahssty.com/"
            },
            // {
            //     "type":"miniprogram",
            //     "name":"跳转微信小程序",
            //     "url":"http://mp.weixin.qq.com",
            //     "appid":"wx286b93c14bbf93aa",
            //     "pagepath":"pages/lunar/index"
            // },
            {
              "type":"click",
              "name":"赞一下我",
              "key":"V1001_GOOD"
           }]
    }]
}