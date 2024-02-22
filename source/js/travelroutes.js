// This JS Module allows us to create a middleman to organize function calls from APIs and pass them to the EJS template

const mapbox = require("../apis/mapbox");
const StaticGlobalData = require("../client/js/ecolutionclientlib");

const ecolutionTravelRoutes = {
    // Function that formats the route data from the MapBox API
    
    // This function produces an array of length 2, where the first element is the second most efficient route and the second element is the most efficient route
    // if we dont have 2 routes provided, we will pad it with an empty array so that we can render the route as the appropriate color
    getRouteWaypoints: function (start, end, mode, EVMode) {
        return new Promise((resolve, reject) => {
            mapbox.getRoute(start, end, mode, EVMode, (error, result) => {
                if (error) {
                    console.error("Error fetching data:", error);
                    reject(error);
                } else {
                    const extendedEcoData = [];
                    const routeData = [];
                    if((result.routes.length > 1)) {

                        // Push the second route to the front, as it isnt the most efficient
                        routeData.push({
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
                
                    // If we're walking, check to see if the distance that we're trying to go is in an acceptable walking distance, if so, we'll push an empty coord so that we can render the route as green
                    } else if ((mode == "walking" && this.IsAcceptableWalkingDistance(result.routes[0])) || mode == "cycling" || EVMode) {
                        routeData.push({
                            type: "FeatureCollection",
                            features: [
                                {
                                    type: "Feature",
                                    properties: {},
                                    geometry: {
                                        coordinates: [0,0],
                                        type: "LineString",
                                    },
                                },
                            ],
                        });
                    }

                    // We're always going to get 1 so we can push this to the back
                    routeData.push({
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

                    //console.log(this.getDrivingEmissionFromRoute(result.routes[0]));
                    //console.log(extendedEcoData);
                    // Push the route information
                    extendedEcoData.push(routeData);
                    // Push the CO2e emissions
                    extendedEcoData.push(mode == "driving-traffic" && !EVMode ? this.getDrivingEmissionFromRoute(result.routes[0]) : 0);
                    resolve(extendedEcoData);
                }
            });
        });
    },

    //Takes in a route and then does a heuristic evaluation to estimate the CO2e emissions
    getDrivingEmissionFromRoute : function(route) {
        //console.log(route);
        // Convert Meters to Miles
        distance = route.distance * 0.000621371;
        // Convert the distance to our estimated CO2eMT emission
        co2e = distance * (StaticGlobalData.userPreferences == null ? StaticGlobalData.avgCO2eMT_driven_per_mile : StaticGlobalData.userPreferences.avgCO2eMT_driven_per_mile);
        return co2e;
    },

    //Takes in a route then uses a heuristic to determine if the walking distance is acceptable
    IsAcceptableWalkingDistance : function(route) {
        distance = route.distance * 0.000621371;
        //console.log(distance <= StaticGlobalData.avgAcceptableWalkingDist_mile);
        return distance <= (StaticGlobalData.userPreferences == null ? StaticGlobalData.avgAcceptableWalkingDist_mile : StaticGlobalData.userPreferences.avgAcceptableWalkingDist_mile);
    }
};

module.exports = ecolutionTravelRoutes;