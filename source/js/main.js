
const ecolutionTravelRoutes = require("./travelroutes");
const MQL = require("./MQL");
const StaticGlobalData = require("../client/js/ecolutionclientlib");
const passport = require('passport');
var userProfile;
//google api data
const GOOGLE_CLIENT_ID ="736230719726-u4c6ik0sscous4930ruld7i0h20dflb4.apps.googleusercontent.com";
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_SECRET = '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';


module.exports = function(app, ecoData, bcrypt, saltRounds) {
    // Route to display the login page
    // Handle our routes
    const isAuthenticated = (req, res, next) => {
        if ((req.session && req.session.username) || req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    };
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
            const username = profile.displayName; // Or profile.emails[0].value for email
            const user = await (await MQL.getMongoDBInstance()).collection('User_Credentials').findOne({ "credentials.username": username });
            if (!user) {
                // If user does not exist, create a new user
                const newUser = {
                    _id: username,
                    username: username,
                    password: accessToken, // Consider encrypting or using a secure method
                    email: profile.emails[0].value,
                    createDate: new Date(),
                    lastLoginDate: new Date(),
                    isActive: "T"
                };
                await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne({}, { $push: { credentials: newUser } });
            } else {
                // Update existing user's last login date or any other relevant information
                await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne(
                    { "credentials.username": username },
                    { $set: { "credentials.$.lastLoginDate": new Date() } }
                );
            }
            console.log("Setting username in session:", username);
            // Here, mark the user as authenticated in the session
            done(null, profile);
        } catch (error) {
            console.log("Error during Google authentication:", user);
            done(error, null);
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.get('/success', (req, res) => res.send(userProfile));

    app.get('/error', (req, res) => res.send('error logging in'));
    
    passport.serializeUser(function(user, done) {
        done(null, user);
      });  
    
      passport.deserializeUser(async (username, done) => {
        try {
            const db = await MQL.getMongoDBInstance();
            // Ensure the query correctly identifies the user. Adjust as per your database schema.
            // This assumes 'id' matches the 'username' saved in the session during serialization.
            const user = await db.collection('User_Credentials').findOne({ "credentials._id": username.displayName });
            if (user) {

                const userData = user.credentials[0];
                userData.username = username.displayName;

                done(null, user);
            } else {
                console.log("User not found:", username);
                console.log("no:"+user);
                done(new Error('User not found'), null);
            }
        } catch (error) {
            console.error("Error during deserialization:", error);
            done(error, null);
        }
    });
    app.post('/api/auth/google', async (req, res) => {
        try {
            const { token } = req.body;
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: '736230719726-u4c6ik0sscous4930ruld7i0h20dflb4.apps.googleusercontent.com',
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            // Now you can use the user's Google ID to find or create a user in your database
            res.send({ status: 'success', user: payload });
        } catch (error) {
            console.error(error);
            res.status(401).send({ status: 'error', message: error.message });
        }
    });
    app.get('/auth/google', 
    passport.authenticate('google', { scope : ['profile', 'email'] }));
    
    
    app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
        if (req.user && req.user.displayName) {
            req.session.username = req.user.displayName; 
        }    
    
    // Successful authentication, redirect success.
    res.redirect('/'); 
    });

    app.get("/", isAuthenticated, async (req, res) => {

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
            console.log("User found:", user);
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

                    // Get and save the user preferences into the session
                    req.session.userpreferences = await MQL.getUserPreferences(username);
                    req.session.usersaveddata = await MQL.getUserSavedData(username);
                    //const yoo = await MQL.getUserAllDailyEmissions(username);
                    req.session.save(err => {
                        if (err) {
                            console.error("Session save error:", err);
                            res.send("An error occurred during login");
                        } else {
                            console.log("Loaded preferences into session:", req.session.userpreferences);
                            // Update the static global data with a cached version of the user preferences
                            StaticGlobalData.userPreferences = req.session.userpreferences;
                            // Update the static global data with a cached version of the user saved data
                            console.log("Loaded saved data into session:", req.session.usersaveddata);
                            StaticGlobalData.userSavedData = req.session.usersaveddata;

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

    app.get("/inputform", isAuthenticated, (req, res) => {
        res.render("inputform.ejs", { username: req.session.username || null });
    });
    app.get("/leaderboard", isAuthenticated, (req, res) => {
        res.render("leaderboard.ejs", { username: req.session.username || null });
    });

    //route to display input form
    app.get("/setting", isAuthenticated, (req, res) => {
        res.render("inputform2.ejs", { username: req.session.username || null });
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
                res.redirect('/inputform');
            }
        } catch (error) {
            console.error("Error during registration:", error);
            res.send("An error occurred during registration");
        }
    });

app.get("/directions", isAuthenticated, (req, res) => {
  res.render("mapboxdirectionexample.ejs", ecoData, { username: req.session.username || null });
});


// TRAVEL ROUTES SECTION

// Route to display the travel routes page
app.get("/ecoTravelRoutes", isAuthenticated, async (req, res) => {
  try {
        //const extendedEcoData = await ecolutionTravelRoutes.getRouteWaypoints([-73.97137, 40.67286], [-122.677738, 45.522458], "driving");
        let extendedEcoData = [];
        res.render("mapboxantpath.ejs", { extendedEcoData: extendedEcoData, username: req.session.username || null });
        
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
            const test = await MQL.AddToDailyEmissions(req.session.username, req.session.cachedMTRoute);
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

  app.post("/updateUserPreferences", async (req, res) => {
    try {
        const { avgAcceptableWalkingDist_mile, GBPostalPrefix, GBPostalSuffix, region, publicProfile } = req.body;
        const userPreferences = await MQL.updateUserPreferences(req.session.username, avgAcceptableWalkingDist_mile, GBPostalPrefix, GBPostalSuffix, region, publicProfile);
        res.json({ userPreferences });
    } catch (error) {
        console.error("Error:", error);
    }
  });

};
