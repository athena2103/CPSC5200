'use strict';


// var mongo = require('mongodb');

// var mongoClient = mongo.MongoClient;
// var url = "mongodb://localhost:27017/address_db";


// mongoClient.connect(url, function(err, db) {
// 	if(err) throw err;
// 	console.log("Database created!");
// 	db.close();
// });


const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'myproject';
 

console.log('START')

// Use connect method to connect to the server
MongoClient.connect(url, { useUnifiedTopology: true }).then(client => {
	console.log('HI')
	// console.log(client)
  // assert.equal(null, err);
  // console.log("Connected successfully to server");
 
  // const db = client.db(dbName);
 
  // client.close();
}).catch(err => {
	console.log('ERROR:', err.message);
});