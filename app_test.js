'use strict';

const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const db_app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//******************Establish database**************
const db_con = require("./app_db_test.js").connect;
const db_schema = require("./app_db_test.js").get;

const db_port = 3001;


db_con(function (err) {
    db_app.listen(db_port, function (err) {
        if (err) {
            throw err; //
        }
        console.log('Database Server: http://localhost:%s', db_port);
    });
});

//*******************Establish API*************
const server = app.listen(process.env.PORT || '8010', function(){
    console.log('Main Server: http://localhost:%s', server.address().port);
});


//Get a list of all supported countries
app.get('/', (req, res) => {
    console.log(Date.now());
    return res.status(200).send(fs.readFileSync('address.html', 'utf8')).end();
});

app.post('/api', (req, res) => {
    console.log('api', Date.now(), req.body);

    const api = req.body.api

    var promise = undefined;

    //Get address formats of all supported countries
    if(api == 'get_patterns' || api == 'search_address') {
    	//Get address component given other components
    	if(api == 'get_patterns') promise = get_patterns(req.body);
		else if(api == 'search_address') promise = search_address(req.body);

    	if(!promise) return res.status(500).send();
	    return promise.then(result => {
	        return res.status(200).send(result);
	    }).catch(err => {
	        return res.status(500).send();
	    });
    } else{
    	return internal_validate(req.body).then(result => {
    		//Record an address
		    if(api == 'record_address') promise = record_address(req.body);
		    //Validate address line
		 	else if (api == 'validate_address') promise = validate_address(req.body);
		    

		    if(!promise) return res.status(500).send();
		    return promise.then(result => {
		        return res.status(200).send(result);
		    }).catch(err => {
		        return res.status(500).send();
		    });

        }).catch(err => {
        	console.log(`validate:`, err);
            return res.status(500).send();
        });
    }

    

});

//Function to get address format
var get_patterns = function(){
    return new Promise((resolve, reject) => {
    	var country_formats = {};
    	const db = db_schema();
	 	var dbo = db.db("addresses");
	 	var collection = dbo.collection('address_format');

	 	collection.find({},{country:1, format:1, _id:0}).toArray(function(err, result){
			if (err) throw err;
			//Build country_formats dictionary
			for (let pair of result){
				country_formats[pair["country"]] = pair["format"]
			}
			return resolve(country_formats);
	 	}); 
    });
}


var record_address = function(obj){
    console.log(`record_address:`);
    return new Promise((resolve, reject) => {
        
    	var recordObj = {}

    	Object.keys(obj).forEach(key => {
    		if(key != 'api'){
    			if(key == "Country"){
    				recordObj[key] = obj[key];
    			}else{
    				recordObj[key] = key == 'Address Line' ? obj[key].toLowerCase() : obj[key].toUpperCase();
    			}
    			// recordObj[key] = key == 'Address Line' ? obj[key].toLowerCase() : obj[key].toUpperCase();
    		}
    	});

    	console.log(recordObj)

    	return recordAddress(recordObj).then(result => {
    		return resolve({ success: true });
    	}).catch(err => {
    		return reject({ success: true });
    	});
    });
}

var recordAddress = function(obj){
    return new Promise((resolve, reject) => {
    	const db = db_schema();
		var dbo = db.db("addresses");
		var collection = dbo.collection('address_data');
		var insert_params = obj;
		collection.insertOne(insert_params, function(err, result) {
		    if (err) throw err;
		    console.log("1 document inserted");
		    //On Success
		    var res = {};
		    if(result){
				res["Result"] = "1 document inserted";
	        } 
		    return resolve(res);
		});
    });
}


var search_address = function(obj){
	return new Promise((resolve, reject) => {
		const db = db_schema();
		var dbo = db.db("addresses");
		var collection = dbo.collection('address_data');
		var search_part = obj['Search'];
		var search_params = {};

		for (const [key, value] of Object.entries(obj)) {
			if (key!= "Search" && key != "api") {
				search_params[key] = value;
			}
	    }

		collection.distinct(search_part, search_params, function(err, result){
			if (err) throw err;
			var res = {};
			//Build list of search for a requested component
			if(result){
				res["Result"] = result  
	        }
	        return resolve(res);
		});
	});
}


var validate_address = function(obj){
    return new Promise((resolve, reject) => {
		const db = db_schema();
		var dbo = db.db("addresses");
		var collection = dbo.collection('address_data');
		var search_params = {};

		for (const [key, value] of Object.entries(obj)) {
			if (key!= "Search" && key != "api") {
				if (key == obj["Search"]){
					search_params[key] = value.trim().toLowerCase();
				} else {
					search_params[key] = value;
				}
				
			}
	    }

		collection.find(search_params).count(function(err, result){
			if (err) throw err;
			//Build count
			var res = {};
			if(result){
				res["Result"] = result;
	        } 

			return resolve(res);
	 	}); 
	});
}

var internal_validate = function(obj){
    console.log(`validate:`, obj);
    return new Promise((resolve, reject) => {
        
        const patternObj = {
            US:     ["State","City","Zip Code","Address Line"],
            China:  ["Province","City","Postal Code","Address Line"],
            Denmark:["City","Postal Code","Country Code","Address Line"],
            Canada: ["Province","Municipality","Postal Code","Address Line"],
        };

        const zipFormat = {
            US:     "^\\b\\d{5}\\b(?:[- ]{1}\\d{4})?$",
            China:  "^\\d{6}$",
            Denmark:"^\\d{4}$",
            Canada: "^(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\d(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\s{0,1}\\d(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\d$",
        }

        if(!obj.Country)             return reject('missing country');
        if(!patternObj[obj.Country]) return reject('missing pattern');
        
        patternObj[obj.Country].forEach(each => {
            if(!obj[each]) return reject('invalid');
            if(each == "Zip Code" || each == "Postal Code"){
                if(!obj[each].match(zipFormat[obj.Country])) return reject('invalid');
            }
        });

        return resolve(true);
    });
}