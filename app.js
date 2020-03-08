'use strict';


const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const patterns = {
    'United States': [`line1`, `line2`, `city`, {head:`state`, body:['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']}, `postal`],
    'Canada':        [`line1`, `line2`, {head:`province`, body:['Alberta', 'British Columbia', 'Manitoba', 'Newfoundland and Labrador', 'New Brunswick', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon']}],
    'Denmark':       [`line1`, `city`, `postal`],
    'Japan':         [`line1`, `postal`],
};








app.get('/', (req, res) => {
    console.log(Date.now());
    return res.status(200).send(fs.readFileSync('address.html', 'utf8')).end();
});


app.post('/api', (req, res) => {
    console.log('api', Date.now(), req.body);

    const api = req.body.api

    var promise = undefined;

         if(api == 'get_patterns')   promise = get_patterns();
    else if(api == 'record_address') promise = record_address(req.body);
    else if(api == 'search_address') promise = search_address(req.body);

    if(!promise) return res.status(500).send();

    return promise.then(result => {
        return res.status(200).send(result);
    }).catch(err => {
        return res.status(500).send();
    });
});


const server = app.listen(process.env.PORT || '8010', function(){
    console.log('url: http://localhost:%s', server.address().port);
});








var get_patterns = function(){
    return new Promise((resolve, reject) => {
        return resolve(patterns);
    });
}


var record_address = function(obj){
    console.log(`record_address`);
    return new Promise((resolve, reject) => {
        return resolve({ success: true });
    });
}


var search_address = function(obj){
    console.log(`search_address`);
    return new Promise((resolve, reject) => {
        return resolve({ success: true, result: ['aaaaa','bbbbb','ccccc'] });
    });
}


var validate = function(obj){
    console.log(`validate:`, obj);
    return new Promise((resolve, reject) => {
        return resolve({ success: true });
    });
}










