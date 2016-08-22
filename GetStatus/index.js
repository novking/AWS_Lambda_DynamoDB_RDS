console.log('Loading function');
var doc = require('dynamobd-doc');
var dynamo = new doc.DynamoDB();
var fs = require('fs');
var mysql = require('mysql');

function readModuleFile(path, callback){
    try{
        var filename = require.resolve(path);
        fs.readFile(filename, 'utf8', callback);
    }catch(e){
        callback(e);
    }
}

exports.handler(event, context){
    console.log('Recieved event: ', JSON.stringify(event, null, 2));
    var username = event.name;
    var password = event.password;
    var conn = mysql.createConnection({
        host: "RDS_endpoint",
        user: "user",
        ssl: "Amazon RDS",
        password: "password",
        database: "the_databas",
    });
    conn.connect(function(err){
        if(err){
            console.error('error connecting'+err.stack);
            return;
        }
        console.log('connected as id'+conn.threadId);
    });
    
    var sql = 'SELECT * FROM login WHERE name ="'+username+'"';
    var result = conn.query(sql, function(error, rows, fields){
        if (error){
            console.log(error.message);
            console.log("The user does't exit");
            console.succeed("The user does't exit.. please create an account");
            throw error;
        }
        else{
            if(typeof rows[0]!='undefined'){
                console.log("Found the userdata");
                if(event.password!=rows[0].password){
                    console.log('incorrect password');
                    readModuleFile('./incorrect.html', function(err, incorrect){
                        var resp = incorrect;
                        context.succeed({"respon":incorrect});
                    });
                }
                var row_id = rows[0].id;
                var name = rows[0].name;
                var sql = "SELECT * FROM login";
                var result = conn.query( sql, function(error, rows, fields){
                    if(error){
                        console.log(error.message);
                        throw error;
                    }
                    else{
                        console.log("row details", rows);
                        details = [];
                        name_detail = [];
                        tail = "";
                        rows.forEach(function(row){
                            console.log("my Id:"+row.id);
                            var i = 0;
                            var rowID = row.id;
                            var params = {
                                "TableName":"status",
                                "Key":{
                                    "UserId":row.id
                                }
                            };
                            dynamo.getItem(params, function(err, data){
                                if (err){
                                    console.log(err);
                                    context.succeed(err);
                                }
                                else{
                                    console.log("the data is :", data);
                                    i++;
                                    console.log("value of i:", i);
                                    details[rowID]=data.Item.status;
                                    name_detail[rowID]=data.Item.name;
                                    console.log("the status to be printed",details[rowID]);
                                    console.log("The length of details array is:",details.length);
                                    tail=tail+"<tr><td><h4>"+name_detail[rowID]+"</h4></td><td><h4>"+details[rowID]+"</h4></td></tr>";	
                                    console.log("the raw length =",rows.length);
                                    console.log("the current  raw ",row.length);
                                    if(i>=rows.length){
                                        readModuleFile('./success.html', function(err, success){
                                            var res = success;
                                            lastres=res+tail+"</tbody></table></div></body></html>"; 
                                            context.succeed({"respon":lastres});
                                        });
                                    }
                                }
                            });
                        });
                    }
                });
            }
            else{
                console.log("The user doesn't exit here");
                readModuleFile('./notexist.html', function(err, not){
                    var rest = not:
                    context.succeed({"respon":rest});
                });
            }
        }
    });
};