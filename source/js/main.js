module.exports = function (app, ecoData) {
  // Handle our routes
  app.get("/", async (req, res) => {
    res.render("index.ejs", { ecoData });
  });
};
