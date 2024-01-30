// This JS Module allows us to create a middleman to organize function calls from APIs and pass them to the EJS template

const mapbox = require("../apis/mapbox");

const ecolutionTravelRoutes = {
    getRouteWaypoints: function (start, end, mode) {
        return new Promise((resolve, reject) => {
            mapbox.getRoute(start, end, mode, (error, result) => {
                if (error) {
                    console.error("Error fetching data:", error);
                    reject(error);
                } else {
                    const extendedEcoData = [];
                    
                    if(result.routes.length > 1) {

                        extendedEcoData.push({
                            type: "FeatureCollection",
                            features: [
                                {
                                    type: "Feature",
                                    properties: {},
                                    geometry: {
                                        coordinates: result.routes[1].geometry.coordinates,
                                        type: "LineString",
                                    },
                                },
                            ],
                        });
                    }

                    extendedEcoData.push({
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                properties: {},
                                geometry: {
                                    coordinates: result.routes[0].geometry.coordinates,
                                    type: "LineString",
                                },
                            },
                        ],
                    });

                    //console.log(extendedEcoData);
                    resolve(extendedEcoData);
                }
            });
        });
    },
};

module.exports = ecolutionTravelRoutes;