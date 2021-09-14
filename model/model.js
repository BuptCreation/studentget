var mongodbclient = require("mongodb").MongoClient
var url= "mongodb://47.94.108.20:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false"
var dbname="BuptCreation"

// var url="mongodb://localhost:27017"
// var dbname="finally"


function connect(callback) {
    mongodbclient.connect(url,function (err,client) {
        if(err){
            console.log("数据库连接失败!")
        }else{
            console.log("数据库连接成功!")
            var db=client.db(dbname)
            callback&callback(db,client)
        }
    })
}

module.exports = {
    connect
}