
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
                    // User authenticated successfully, update lastLoginDate
                    await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne(
                        { "credentials.username": username },
                        { $set: { "credentials.$.lastLoginDate": new Date() } } // Set lastLoginDate to current date
                    );
                    console.log("Setting username in session:", userData.username);
                    req.session.username = userData.username;
                    req.session.save(err => {
                        if (err) {
                            console.error("Session save error:", err);
                            res.send("An error occurred during login");
                        }
                    });
                    // Get and save the user preferences into the session
                    req.session.userpreferences = await MQL.getUserPreferences(username);
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
            const existingUser = await (await MQL.getMongoDBInstance()).collection('User_Credentials').findOne({ "credentials._id": username });
            if (existingUser) {
                res.send("User already exists with that username");
            } else {
                const newUser = {
                    _id: username,
                    username: username,
                    password: password,
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


// TRAVEL ROUTES SECTION

// Route to display the travel routes page
app.get("/ecoTravelRoutes", async (req, res) => {
  try {
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
        const { origin, destination, travelMode, EVMode } = req.body;
        // Get the route information from the given data
        const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints(origin, destination, travelMode, EVMode);
        // Cache the route CO2eMT on the session
        req.session.cachedMTRoute = extendedEcoData[1];
        // Log the cached route
        console.log(req.session.cachedMTRoute);
        // Return all the data to the front end
        res.json({ extendedEcoData });
    } catch (error) {
        console.error("Error:", error);
    }
});

// Function to commit the journey carbon to the database
app.post("/commitjourneycarbon", async (req, res) => {
    try {
        // Just log the amount to double check for NaNs if that we're ever to occur
        console.log("Committing", req.session.cachedMTRoute, "to the database");
        // Double check here to make sure that we're not trying to commit a NaN
        if((req.session.cachedMTRoute != null || req.session.cachedMTRoute != undefined) && req.session.cachedMTRoute != 0){
            // Add the new journey carbon to the users standing amount
            const succesfullyUpdated = await MQL.AddToTotalEmission(req.session.username, req.session.cachedMTRoute);
            // Return the success of the update
            res.json({ succesfullyUpdated });
        // If we're trying to commit a 0 then we can skip the log as the update (currently) doesnt do anything but take up bandwidth
        } else if (req.session.cachedMTRoute == 0)
        {
            console.log("No emissions to add, skipping the log");
            res.json({ succesfullyUpdated: true });
        } else {
            console.error("Error trying to commit new journey carbon, make sure a route has been chosen");
            res.json({ succesfullyUpdated: false });
        }
    } catch (error) {
        console.error("Error trying to commit new journey carbon: ", error);
    }
  });

};
