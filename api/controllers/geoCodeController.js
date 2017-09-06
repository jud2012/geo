var url = require('url');
var request = require('request');
var auth = require('basic-auth');
const options = require('config.js');
var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder(options);
var cache = {maps: {}, wiki: {}}; // caching mechanism- will keep the value of the requested URL's
var usage_request = []; // caching mechanism- will keep a record of every requested URL

// get_address_coordinates function receive an address as param
// the function convert the address to coordinates using node-geocoder
// caching functionality is implemented by memory,
//      It was possible to implement it also by DB (creating a requests table of 2 columns- request and data)

exports.get_address_coordinates = function(req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var address = query.address;
    usage_request.push(req.url);
    if (cache.maps[address] != undefined){
        //console.log('cache');
        res.json({lat: cache.maps[address].latitude, lon: cache.maps[address].longitude});
    }
    else {
        geocoder.geocode(address)
            .then(function(response) {
                if (response.length > 0) {
                    //console.log('api');
                    cache.maps[address] = {latitude: response[0].latitude, longitude: response[0].longitude};
                    res.json({lat: response[0].latitude, lon: response[0].longitude});
                }
                else
                    res.json({});
            })
            .catch(function(err) {
                res.json({succeedded: false});
            });
    }
};

// get_places_near_by use MediaWiki API in order to get 10 nearby wikipedia information
// caching functionality is implemented by memory,
//      It was possible to implement it also by DB (creating a requests table of 2 columns- request and data)

exports.get_places_near_by = function(req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var lon = query.lon;
    var lat = query.lat;

    usage_request.push(req.url);
    if(cache.wiki[lon+''+lat] != undefined){
        //console.log('cache');
        var result = cache.wiki[lon+''+lat];
        res.json(parseResult(result));
    }
    else{
        request('https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=' + lon + '%7C' + lat + '&gsradius=10000&gslimit=10&format=json&piprop=thumbnail&pithumbsize=144&pilimit=50', function (error, response, body) {
            //console.log('api');
            cache.wiki[lon+''+lat] = JSON.parse(response.body).query.geosearch;
            res.json(parseResult(JSON.parse(response.body).query.geosearch));
        });
    }
};

// get_requests return a list of all requests made to the api since it went up
// using basic authentication
exports.get_requests = function(req, res) {
    var credentials = auth(req);
    if (!credentials || credentials.name !== 'admin' || credentials.pass !== 'password1') {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="example"')
        res.end('Access denied')
    } else {
        res.json(usage_request);
    }   
};

// purge_cache clean the cache
exports.purge_cache = function(req, res) {
    cache = {maps: {}, wiki: {}};
    res.end('Done!');
};


// parseResult is a helper function that receive a full object
// return an array of objects
function parseResult(result) {
    var res_arr = [];
    for (var index in result){
        var obj = {title: result[index]['title'], coordinates: {lat: result[index]['lat'], lon: result[index]['lon']}};
        res_arr.push(obj);
    }
    return res_arr;
}
