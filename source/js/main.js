const ecolutionTravelRoutes = require("./travelroutes");

module.exports = function (app, ecoData) {
  // Handle our routes
  app.get("/", (req, res) => {
    res.render("index.ejs", ecoData);
  });

  app.get("/directions", (req, res) => {
    res.render("mapboxdirectionexample.ejs", ecoData);
  });

  app.get("/antpath", async (req, res) => {
    try {
      
        // Use the helper library to get the data set
        //const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints([-73.97137, 40.67286], [-122.677738, 45.522458], "driving");
        let extendedEcoData = [];
        res.render("mapboxantpath.ejs", { extendedEcoData: extendedEcoData });
      
    } catch (error) {
        console.error("Error:", error);
    }
  });

  app.post("/calculateRoute", async (req, res) => {
    try {
        const { origin, destination, travelMode } = req.body;

        const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints(origin, destination, travelMode);

        res.json({ extendedEcoData });
    } catch (error) {
        console.error("Error:", error);
    }
  });

};