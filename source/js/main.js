module.exports = function (app, ecoData) {
  // Handle our routes
  app.get("/", (req, res) => {
    res.render("index.ejs", ecoData);
  });
};
