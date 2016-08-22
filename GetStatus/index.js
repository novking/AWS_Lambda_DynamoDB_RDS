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
                    readModuleFile('./incorrect.html')
                }
            }
            else{
                
            }
        }
    });
}