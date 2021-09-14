var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var ws=require("nodejs-websocket")
var model = require("./model/model")

var server=ws.createServer(function (conn) {
  conn.on("text",function (str) {
    var data = JSON.parse(str);
    if(data.type!=="Heartbeat"){
    if(data.type==="orignal"){
    var textno = data.textno;     //记录文章号
    var studentno = data.studentno;     //记录学生账号
    var name=[];            //记录学生的名字
    var thedescription;        //记录文章描述
    var groupno=null;            //记录文章的组别号
    var id=[];              //记录学生的id号
    var answerdata=[];      //记录返回的第一组数据
    var answerdata2=[];
    var answerdata3=[];
    console.log("这是original发过来的信息",data)
    model.connect(function (db,client) {
      db.collection("mapping").find({textno:textno}).toArray(function (err,ret) {   //找到指定的组号
        if(err){
                  console.log("从mapping中读取指定文章的作者信息出现了错误!")
                  conn.sendText(JSON.stringify({error:"error"}))
        }else{
                groupno=ret[0].groupno
                db.collection('dataarrays').find({textno:textno}).toArray(function (err,ret) {      //根据文章号把文章加载出来
                    if(err){
                        console.log("dataarrays查询组成echarts失败!")
                    }else{
                        console.log(ret)
                        if(ret!==null){
                            for(var i=0;i<ret[0].authors.length;i++){
                                answerdata.push({value:ret[0].contributions[i],name:ret[0].authors[i]});
                                answerdata2.push({value:ret[0].logintimes[i],name:ret[0].authors[i]});
                                answerdata3.push({value:ret[0].talks[i],name:ret[0].authors[i]});
                            }
                        }


                        db.collection("buptgroup").find({groupid:parseInt(groupno)}).toArray(function (err,ret) {    //根据组名把组员加载进来
                            if(err){
                                console.log("读取小组信息出现了错误！")
                            }else{
                                console.log(groupno)
                                console.log(ret)
                                for(var i=0;i<ret.length;i++){
                                    console.log(ret[i])
                                    name.push(ret[i].studentname)
                                    console.log(name)
                                    id.push(ret[i].studentno)
                                    console.log(id)
                                }

                                db.collection("article").find({textno:textno}).toArray(function (err,ret) { //找到文章的描述信息
                                    if(err){
                                        console.log("读取文章信息出现了错误!")
                                    }else{
                                        thedescription=ret[0].description;
                                        console.log(answerdata)
                                        // while(thedescription==null||groupno==null||name===[]||id===[]||answerdata===[]) {
                                        var thestring = JSON.stringify({
                                            type:"0",
                                            error: "none",
                                            articledescription: thedescription,
                                            groupno: groupno,
                                            name: name,
                                            id: id,
                                            datas: answerdata,
                                            datas1:answerdata2,
                                            datas2:answerdata3,

                                        });
                                        console.log(thestring)

                                        conn.sendText(thestring);
                                    }
                                })


                            }
                        })

                    }
                })

        }
      })

    })
    }else if(data.type==="fetchdata"){
        model.connect(function (db) {
            db.collection("dataarrays").find({textno:data.textno}).toArray(function (err,ret) {
                if(err){
                    console.log("获取dataarrays数据出现了问题!",err)
                }else{
                    var authors=[]
                    var contributions=[]
                    var logintimes=[]
                    var talks=[]
                    var groupid;
                    authors=ret[0].authors
                    contributions=ret[0].contributions
                    // conn.sendText(JSON.stringify({authors:authors,contributions:contributions,logintimes:logintimes,talks:talks}))
                    db.collection("mapping").find({textno:data.textno}).toArray(function (err,ret) {//找到对应的groupid然后根据对应的id进行接下来的操作
                        if(err){
                            console.log("出错了，宝贝儿");
                        }else{
                            let authorsoflogin=[];
                            groupid=ret[0].groupno;
                            db.collection("buptgroup").find({groupid:parseInt(groupid)}).toArray(function (err,ret) {
                                if(err){
                                    console.log("出错了！")
                                }else{
                                    ret.map(function (item,index) {
                                        authorsoflogin.push(item.studentname);
                                        logintimes.push(item.logins);
                                    })
                                    var thelogintime=[];
                                    for(var t=0;t<authorsoflogin.length;t++){                                                                                                  //统计登录时间的时间表存储到thelogintime
                                        thelogintime.push({value:logintimes[t],name:authorsoflogin[t]});
                                    }
                                    // console.log(thelogintime)
                                    db.collection("chatmessage").find({groupid:parseInt(groupid)}).toArray(function (err,ret) {   //统计谈话的所有数据存储到thetalks
                                        if(err){
                                            console.log("查找数据出现了错误")
                                        }else{
                                            var authordatas=[];
                                            var talks=[];
                                            var finalret=ret;
                                            console.log(finalret)
                                            db.collection("buptgroup").find({groupid:parseInt(groupid)}).toArray(function (err,ret) {
                                                if(err){
                                                    console.log("出现了些许错误!")
                                                }else{
                                                    // console.log(ret);
                                                    ret.map(function (item,index) {
                                                        authordatas.push(item.studentname);
                                                        talks.push(0);
                                                    })
                                                    // console.log("finalret的结果是：",finalret)
                                                    finalret.map(function (item,index) {
                                                        for (var j = 0; j < authordatas.length; j++) {
                                                            // console.log(item.sender)
                                                            if (item.sender === authordatas[j]) {
                                                                talks[j]++;
                                                            }
                                                        }
                                                    })
                                                    // console.log("talks的结果是：",talks)
                                                    // console.log("authordatas的结果是",authordatas)
                                                    // console.log(talks,authordatas)
                                                    var thetalks=[];                                                                                    //把数据统计到thetalks数组之中
                                                    for(var i=0;i<talks.length;i++){
                                                        thetalks.push({value:talks[i],name:authordatas[i]});
                                                    }
                                                    // console.log(thetalks)





                                                    //统计所有的与social有关的数据
                                                    var nodes=[];
                                                    var categories=[];
                                                    var links=[];
                                                    for(var i=0;i<20;i++){
                                                        categories.push(i);
                                                    }
                                                    var positionx=[-83,-20,48,42,50,0,6,-30,-64,-150,-200,-17,-67,0,-100,10,10,-50];
                                                    var positiony=[120,49,47,235,-75,81,100,95,200,90,46,-1,-36,35,40,48,150,160];
                                                    model.connect(function (db) {
                                                        db.collection("chatmessage").find({groupid:parseInt(groupid)}).toArray(function (err,ret) {
                                                            if(err){
                                                                console.log("查询socials数据出现了错误！")
                                                            }else{
                                                                if(ret){
                                                                    let retfather=ret;
                                                                    //对数据进行初步的处理，把各种数组全部都统计完毕
                                                                    let authors=[];             //记录对应的作者
                                                                    let connections=[];         //记录对应的连接方式
                                                                    let authorsandvalues=[];    //记录作者的谈话次数
                                                                    let connectionsandvalues=[];//关联和数值
                                                                    let totalconnectionvalues=0; //统计总的connections的数量
                                                                    let totaltalkvalues=0;       //统计总的talk的数量
                                                                    let mapping=[];
                                                                    db.collection("buptgroup").find({groupid:parseInt(groupid)}).toArray(function (err,ret) {
                                                                        if(err){
                                                                            console.log("查找数据出现了问题！")
                                                                        }else{
                                                                            ret.map(function (item,index) {
                                                                                mapping.push({studentno:item.studentno,studenname:item.studentname});
                                                                            })

                                                                            db.collection("dataarrays").find({textno:data.textno}).toArray(function (err,ret) {  //处理authors和authorsandvalues
                                                                                if(err){
                                                                                    console.log("查询出现了错误！")
                                                                                }else{
                                                                                    authors=ret[0].authors;
                                                                                    for(var i=0;i<authors.length;i++){
                                                                                        authorsandvalues.push(1);
                                                                                    }


                                                                                    for(var i=0;i<authors.length;i++){                                      //把学号一一映射成username
                                                                                        for(var j=0;j<mapping.length;j++){
                                                                                            if(mapping[j].studentno===authors[i]){
                                                                                                authors[i]=mapping[j].studenname;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    // console.log(authorsandvalues)
                                                                                    // console.log(authors)
                                                                                    // console.log(retfather)
                                                                                    for(var i=0;i<retfather.length;i++){          //遍历每一条数据，然后对values进行初始累加
                                                                                        totaltalkvalues++;
                                                                                        for(var j=0;j<authors.length;j++){  //如果不是@就正常统计就OK了
                                                                                            if(retfather[i].sender===authors[j]){
                                                                                                authorsandvalues[j]++;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                        var str=retfather[i].atwhos.split("\"");
                                                                                        if(retfather[i].isat==true){            //如果是@需要对connections进行相应的操作
                                                                                            totalconnectionvalues++;
                                                                                            let flags=1;
                                                                                            for(var j=0;j<connections.length;j++){
                                                                                                var str=retfather[i].atwhos.split("\"");
                                                                                                console.log(str[1]);
                                                                                                if((connections[j].sender===retfather[i].sender)&&(connections[j].target===str[1])){
                                                                                                    connectionsandvalues[j]++;
                                                                                                    flags=0;
                                                                                                    break;
                                                                                                }
                                                                                            }
                                                                                            if(flags==1){
                                                                                                var str=retfather[i].atwhos.split("\"");
                                                                                                connections.push({sender:retfather[i].sender,target:str[1]});
                                                                                                connectionsandvalues.push(1);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    // console.log(authors);
                                                                                    // console.log(authorsandvalues);
                                                                                    // console.log(connections);
                                                                                    // console.log(connectionsandvalues);
                                                                                    //对所有的values进行集中化处理，避免出现线条过于粗大以及标记点过于膨胀的现象
                                                                                    for(var b=0;b<connectionsandvalues.length;b++){
                                                                                        connectionsandvalues[b]=parseInt((8*(authors.length)*connectionsandvalues[b])/totalconnectionvalues);
                                                                                    }
                                                                                    for(var c=0;c<authorsandvalues.length;c++){
                                                                                        authorsandvalues[c]=parseInt((25*(authors.length)*authorsandvalues[c])/totaltalkvalues);
                                                                                    }


                                                                                    //将所有的数据转换成合适的格式
                                                                                    for(var i=0;i<authors.length;i++){
                                                                                        nodes.push({id:authors[i],name:authors[i],symbolSize:authorsandvalues[i],x:positionx[i],y:positiony[i],value:authorsandvalues[i],category:categories[i]});
                                                                                    }
                                                                                    for(var i=0;i<connections.length;i++){
                                                                                        links.push({source:connections[i].sender,target:connections[i].target,lineStyle:{width:connectionsandvalues[i]},value:connectionsandvalues[i]});
                                                                                    }
                                                                                    // console.log(nodes);
                                                                                    // console.log(links);
                                                                                    var categoriestosubmit=[];
                                                                                    for(var t1=0;t1<authors.length;t1++){
                                                                                        categoriestosubmit.push({name:authors[t1]});
                                                                                    }

                                                                                    var social={nodes:nodes,links:links,categories:categoriestosubmit};

                                                                                    db.collection("graphstatement").find({groupid:parseInt(groupid),textno:data.textno}).toArray(function (err,ret) {
                                                                                        if(err){
                                                                                            console.log("有点问题呀!")
                                                                                        }else {
                                                                                            var statement = {
                                                                                                statement1: 0,
                                                                                                statement2: 0,
                                                                                                statement3: 0,
                                                                                                statement4: 0
                                                                                            };
                                                                                            statement.statement1 = ret[0].statement1;
                                                                                            statement.statement2 = ret[0].statement2;
                                                                                            statement.statement3 = ret[0].statement3;
                                                                                            statement.statement4 = ret[0].statement4;
                                                                                            console.log("这是取statement的结果", statement)
                                                                                            conn.sendText(JSON.stringify({
                                                                                                type: "0",
                                                                                                authors: authors,
                                                                                                statement: statement,
                                                                                                contributions: contributions,
                                                                                                thelogintimes: thelogintime,
                                                                                                talks: thetalks,
                                                                                                categoriestosubmit: social
                                                                                            }))
                                                                                        }})

                                                                                }
                                                                            })

                                                                        }
                                                                    })

                                                                }
                                                            }
                                                        })
                                                    })



                                                }
                                            })


                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
    }}
    else {
        console.log(data)
        conn.sendText(JSON.stringify({type:"Heartbeat"}))
    }
  })              //对接收到的字符串进行相应的处理

  conn.on("close",function () {
    console.log("链接已经断开了")
  })

  conn.on("error",function (err) {
    console.log("websocket连接出错了!",err);
  })

}).listen(3335)


var server2=ws.createServer(function (connect) {

    connect.on("text",function (str) {
        var data=JSON.parse(str);
        if(data.type!=="Heartbeat"){
        if(data.type==="catchtextno"){
            var groupno=null;
            model.connect(function (db,client) {
                console.log(data.studentno);
                db.collection("buptgroup").find({studentname:data.studentno }).toArray(function (err,ret) {
                    if(err){
                        console.log("查找失败!");
                    }else{
                        groupno=ret[0].groupid;
                        db.collection("mapping").find({groupno:""+groupno}).toArray(function (err,ret) {
                            if(err){
                                console.log("查找文章列表出现了一些小意外呢!");
                            }else{
                                let textnos=[];
                                ret.map(function (item,index) {
                                    textnos.push(item.textno);
                                })
                                console.log(textnos)
                                connect.sendText(JSON.stringify({type:"0",textnos:textnos}));
                            }
                        })
                    }
                })
            })
        }}
        else{
            console.log(data);
            connect.sendText(JSON.stringify({type:"Heartbeat"}))
        }
    })

    connect.on("err",function (err) {
        console.log("出现了错误！",err)

    })
    connect.on("close",function () {
        console.log("断开了连接!")
    })

}).listen("3336");
console.log("listening at port 3335")
console.log("listening at port 3336")
