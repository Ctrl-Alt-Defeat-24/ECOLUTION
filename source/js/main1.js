const ecolutionTravelRoutes = require("./travelroutes");

module.exports = function (app, ecoData, db, bcrypt, saltRounds, collection) {

//   app.get("/login", (req, res) => {
//     res.render("login.ejs");
//   });

// app.post("/login", async (req, res) => {
//     // Authentication logic for login
//     const { username, password } = req.body;
//     const user = await db.collection('User_Credentials').findOne({ username });
    
//     if (user) {
//         const match = await bcrypt.compare(password, user.password);
//         if (match) {
//             res.send("Logged in successfully");
//         } else {
//             res.send("Incorrect password");
//         }
//     } else {
//         res.send("User not found");
//     }
//   });

// app.get("/register", (req, res) => {
//     res.render("register.ejs");
//   });

// app.post("/register", async (req, res) => {
//     // Logic to handle user registration
//     const { username, password } = req.body;
//     const existingUser = await db.collection('User_Credentials').findOne({ username });

//     if (existingUser) {
//         res.send("Username already taken");
//     } else {
//         const hashedPassword = await bcrypt.hash(password, saltRounds);
//         await db.collection('User_Credentials').insertOne({ username, password: hashedPassword });
//         res.send("Registered successfully");
//     }
//   });

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