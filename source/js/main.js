const mapbox = require("../apis/mapbox");
module.exports = function (app, ecoData) {
  // Handle our routes
  app.get("/", (req, res) => {
    res.render("index.ejs", ecoData);
  });

  app.get("/directions", (req, res) => {
    res.render("mapboxdirectionexample.ejs", ecoData);
  });

  app.get("/antpath", (req, res) => {
    mapbox.getRoute([-73.97137,40.67286], [-122.677738, 45.522458], "driving", (error, result) => {
        if (error) {
          console.error("Error fetching data:", error);
        } else {
          // Get the pathing result so we can display it on the map
          const extendedEcoData = {
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
          };
          console.log(extendedEcoData);

          // Pass the extendedEcoData to the EJS template
          res.render("mapboxantpath.ejs", { extendedEcoData: extendedEcoData });
        }
      }
    );
  });
};
