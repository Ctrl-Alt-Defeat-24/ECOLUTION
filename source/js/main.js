module.exports = function (app, ecoData, chart) {
  // Handle our routes
  app.get("/", async (req, res) => {
    const sampleData = { 
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'], 
      values: [12, 19, 3, 5, 2, 3] 
  };
    res.render("index.ejs", { chart, ecoData});
  });
};
