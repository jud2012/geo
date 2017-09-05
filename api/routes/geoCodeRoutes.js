module.exports = function(app) {
    var geoCodeController = require('../controllers/geoCodeController');

    // get convert address to coordinates
    app.route('/geocode')
      .get(geoCodeController.get_address_coordinates);

    // get find wiki nearby places, by coordinates
    app.route('/wikiNearby')
      .get(geoCodeController.get_places_near_by);

    // get usage- list of all requests
    app.route('/usage')
        .get(geoCodeController.get_requests);

    // post- clean all requests
    app.route('/purgeCache')
        .post(geoCodeController.purge_cache);
};