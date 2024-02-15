
const ecolutionTravelRoutes = require("./travelroutes");
const MQL = require("./MQL");
const StaticGlobalData = require("../client/js/ecolutionclientlib");

module.exports = function(app, ecoData, bcrypt, saltRounds) {
    // Route to display the login page
    // Handle our routes
    app.get("/", async (req, res) => {
      res.render("index.ejs", {ecoData, username: req.session.username || null});
  });
    app.get("/login", (req, res) => {
        res.render("login.ejs", { username: req.session.username || null });
    });

    // Route to handle login logic
    app.post("/login", async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await (await MQL.getMongoDBInstance()).collection('User_Credentials').findOne({ "credentials.username": username }, { projection: { credentials: { $elemMatch: { username } } } });
            if (user && user.credentials && user.credentials.length > 0) {
                const userData = user.credentials[0];
                if (password === userData.password){
                    console.log("Setting username in session:", userData.username);
                    req.session.username = userData.username;
                    req.session.save(err => {
                        if (err) {
                            console.error("Session save error:", err);
                            res.send("An error occurred during login");
                        }
                    });
                    // Get and save the user preferences into the session
                    req.session.userpreferences = await (await MQL.getMongoDBInstance()).collection('User_Preferences').findOne({ _id: userData.username });
                    req.session.save(err => {
                        if (err) {
                            console.error("Session save error:", err);
                            res.send("An error occurred during login");
                        } else {
                            console.log("Loaded preferences into session:", req.session.userpreferences);
                            // Update the static global data with a cached version of the user preferences
                            StaticGlobalData.userPreferences = req.session.userpreferences;
                            res.redirect('/');
                        }
                    });
                } else {
                    res.send("Incorrect password");
                }
            } else {
                res.send("User not found");
            }
        } catch (error) {
            console.error("Error during login:", error);
            res.send("An error occurred during login");
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error during logout:", err);
                res.send("An error occurred during logout");
            } else {
                res.redirect('/login');
            }
        });
    });

    // Route to display the registration page
    app.get("/register", (req, res) => {
        res.render("register.ejs");
    });

    // Route to handle registration logic
    app.post("/register", async (req, res) => {
        const { email, username, password } = req.body;
        try {
            const existingUser = await (await MQL.getMongoDBInstance()).collection('User_Credentials').findOne({ "credentials.username": username });
            if (existingUser) {
                res.send("User already exists with that username");
            } else {
                const newUser = {
                    username: username,
                    password: password, // In a real application, you should hash the password
                    email: email,
                    createDate: new Date(),
                    lastLoginDate: null,
                    isActive: "T"
                };
                await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne({}, { $push: { credentials: newUser } });
                res.redirect('/login');
            }
        } catch (error) {
            console.error("Error during registration:", error);
            res.send("An error occurred during registration");
        }
    });

app.get("/directions", (req, res) => {
  res.render("mapboxdirectionexample.ejs", ecoData);
});

app.get("/ecoTravelRoutes", async (req, res) => {
  try {
    
      // Use the helper library to get the data set
      //const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints([-73.97137, 40.67286], [-122.677738, 45.522458], "driving");
      let extendedEcoData = [];
      res.render("mapboxantpath.ejs", { extendedEcoData: extendedEcoData });
    
  } catch (error) {
      console.error("Error:", error);
  }
});

  // Function to take in the origin and destination and return the waypoints for any route(s)
app.post("/calculateRoute", async (req, res) => {
  try {
      const { origin, destination, travelMode } = req.body;

      const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints(origin, destination, travelMode);

        // Return the json object
      res.json({ extendedEcoData });
  } catch (error) {
      console.error("Error:", error);
  }
});
};
