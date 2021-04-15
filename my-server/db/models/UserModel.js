var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({ //表结构对象
    user:String,
    pwd:String
})
var userModel = mongoose.model('userModel',userSchema); //操作表结构对象的数据模型
// 通过模型，才能操作数据

module.exports = userModel; // 将模型导出