console.log('Loading function');
var doc = require('dynamodb-doc');
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

exports.handler = function(event, context){
    console.log('Received event:', JSON.stringify(event, null, 2));
    var username = event.name;
    var password = event.password;
    var conn = mysql.createConnection({
        host:'RDS endpoint from AWS',
        user: 'username',
        password: 'password',
        ssl: 'Amazon RDS',
        database: 'the_database_name',
    });
    conn.connect(function(err){
        if (err){
            console.error('error connecting: '+ err.stack);
            return;
        }
        console.log('connected as id '+ conn.threadId);
    });
    var sql = 'SELECT * FROM login WHERE name = "'+username+'"';
    var result = conn.query(sql, function(error, rows, fields){
        if (error){
            console.log(error.message);
            console.log("the user doesn't exsit");
            console.succeed("The user doesn't exit.. please create an account");
            throw error;
        }
        else{
            if(typeof rows[0]!= 'undefined'){
                console.log("Found the userdata");
                console.log('Names are: ', rows[0].id, rows[0].name, rows[0].password);
                if(event.password!=rows[0].password){
                    console.log("incorrect password");
                    readModuleFile('./incorrect.html', function(err, incorrect){
                        var resp = incorrect;
                        context.succeed({"respon":incorrect});
                    });
                }
                var row_id = rows[0].id;
                var name = rows[0].name;
                var status = event.status;
                dynamo.putItem({
                    "TableName":"status",
                    "Item":{
                        "UserId":row_id,
                        "name":name,
                        "status":status,
                    }
                },
                function(err, data){
                    if(err){
                        console.log(err);
                    }else{
                        console.log(data);
                        console.log("Status updated");
                        readModuleFile('./success.html', function(err, success){
                            var resp = success;
                            var last = "</h1></div></body></html>";
                            var result = resp+" "+ event.name+", Your Status successfully updated</h3></br><h1> Status: "+event.status+last;
                            context.succeed({"respon":result});
                        });
                    }
                };
                );
            }
            else{
                console.log("The user doesn't exist here");
                readModuleFile('./notexist.html', function(err, not){
                    var res = not;
                    context.succeed({
                        "respon":res
                    });
                });
            }
        }
    });
};