const mongo_client = require('mongodb').MongoClient, format= require('util').format;

const mongo_url = 'mongodb://127.0.0.1:27017';
let mongo_db;

function connect(callback){
    mongo_client.connect(mongo_url, {useUnifiedTopology: true}, (err, db) => {
        if(err){
			throw err;
		} else {
			console.log("Database Successfully Connected");
		}
        mongo_db = db;
        callback();
    });
};

function get(){
    return mongo_db;
};

function close(){
    mongo_db.close();
};

module.exports = {
    connect,
    get,
    close
};

