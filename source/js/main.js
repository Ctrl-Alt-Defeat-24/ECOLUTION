module.exports = function (app, ecoData) {
  // Handle our routes
  app.get("/", (req, res) => {
    res.render("index.ejs", ecoData);
  });

  app.get("/directions", (req, res) => {
    res.render("mapboxdirectionexample.ejs", ecoData);
  });

  app.get("/antpath", (req, res) => {
    res.render("mapboxantpath.ejs", ecoData);
  });
};
