console.log('Loading function');

var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var fs = require('fs');
var mysql = require('mysql');

function readModuleFile(path, callback){
    try{
        var filename = require.resolve(path);
        fs.readFile(filename, 'utf8', callback);
    }
    catch(e){
        callback(e);
    }
}

exports.handler = function(event, context){
    console.log('Received event:', JSON.stringify(event, null, 2));
    var username = event.name;
    var password = event.password;
    var conn = mysql.createConnection({
        host:'AWS RDS endpoint',//im using windows, don't want to install CLI
        user: 'user',
        ssl: 'Amazon RDS',
        password:'mypassword',
        database:'the_data_base_name'
    });
    
    conn.connect(function(err){
        if (err){
            console.error('error connecting: '+ err.stack);
            return;
        }
        console.log('connected as id' + conn.threadId);
    });
    
    var sql = 'INSERT INTO login (name, password) VALUES("'+username+'","'+password+'")';
    var result = conn.query(sql, function(error, info){
        if (error){
            console.log(error.message);
            if(error.errno==1062){
                console.log("already exists");
            };
            readModuleFile('./unsuccessful.txt', function(err, alreadyexit){
                var resp = alreadyexit;
                context.succeed({"respon":resp});
            });
        }
        else{
            console.log("trying to add the no status");
            var row_id = info.insertId;
            console.log("the info contains:", info);
            console.log("the row_id:", info.insertId);
            var name = event.name;
            var status = "No Status";
            dynamo.putItem({
                "TableName":"status",
                "Item":{
                    "UserId":row_id,
                    "name": name,
                    "status":status,
                }
            },
            function(err, data){
                if(err){
                    console.log(err);
                }
                else{
                    console.log(data);
                    console.log("Status updated");
                    readModuleFile('./successful.txt', function(err, added){
                        var res = added;
                        console.log('success');
                        console.log("insert values in to database:", result.sql);
                        context.succeed({"respon":res});
                    });
                }
            });
        }
    });
}