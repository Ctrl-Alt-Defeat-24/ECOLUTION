
const ecolutionTravelRoutes = require("./travelroutes");
const cbreakdown = require('./carbonbreakdown');
const MQL = require("./MQL");
const StaticGlobalData = require("../client/js/ecolutionclientlib");
const passport = require('passport');
const axios = require('axios');
const recycle = require('./gb_recyclecentres');
var userProfile;
//google api data
const GOOGLE_CLIENT_ID ="736230719726-u4c6ik0sscous4930ruld7i0h20dflb4.apps.googleusercontent.com";
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_SECRET = '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';
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Your routes and other middleware below this line



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
        callbackURL: "http://localhost:8000/auth/google/callback",
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
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
                req.session.isNewUser = true;
                await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne({}, { $push: { credentials: newUser } });
            } else {
                // Update existing user's last login date or any other relevant information
                await (await MQL.getMongoDBInstance()).collection('User_Credentials').updateOne(
                    { "credentials.username": username },
                    { $set: { "credentials.$.lastLoginDate": new Date() } }
                );
                req.session.isNewUser = false;

            }
            console.log("Setting username in session:", username);
            // Here, mark the user as authenticated in the session
            done(null, profile);
        } catch (error) {
            console.log("Error during Google authentication:", profile, error);
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
        if (req.session.isNewUser) {
            res.redirect('/inputform');
        } else {
            // Successful authentication, redirect home.
            res.redirect('/'); 
        }
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
        res.render("register.ejs", { error: null , passwordError : null});
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
        const { email, username, password, confirmPassword} = req.body;
        let passwordError = null; // Define passwordError here
            // Check password requirements
        if (password.length < 8) {
            passwordError = "Password must be at least 8 characters long";
        } else if (!/[A-Z]/.test(password)) {
            passwordError = "Password must contain at least one capital letter";
        }
        try {
            // Check if password and confirm password match
            if (password !== confirmPassword) {
                res.render("register.ejs", { error: null, passwordError: "Passwords do not match.", username: req.session.username || null });
                return; // End the function if passwords do not match
            }

            const existingUser = await (await MQL.getMongoDBInstance()).collection('User_Credentials').findOne({ "credentials._id": username });
            if (existingUser) {
                res.render("register.ejs", { error: "User already exists with that username", passwordError: null, username: req.session.username || null });
            } else if (passwordError !== null) {
                res.render("register.ejs", { error: null, passwordError: passwordError, username: req.session.username || null });
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
                newUser.username = username.displayName;
                req.session.username = username;
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
                const succesfullyUpdated = await MQL.AddToTotalEmission(req.session.username, req.session.cachedMTRoute);
                const succesfullyUpdated2 = await MQL.AddToDailyEmissions(req.session.username, req.session.cachedMTRoute);
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
            if(userPreferences){
                req.session.userpreferences = await MQL.getUserPreferences(req.session.username);
                req.session.save(err => {
                    if (err) {
                        console.error("Session save error:", err);
                    } else {
                        console.log("Loaded preferences into session:", req.session.userpreferences);
                        // Update the static global data with a cached version of the user preferences
                        StaticGlobalData.userPreferences = req.session.userpreferences;
                    }
                });
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

  
    app.get('/chart-data', async (req, res) => {
        try {
            const allDailyEmissions = await MQL.getUserAllDailyEmissions(req.session.username);
            
            // Extract the emissions values for the recent 7 days
            const recentData = allDailyEmissions.slice(-7).map(entry => parseFloat(entry[1]) || 0);
            res.json({ data1: recentData });
        } catch (error) {
            console.error("Error fetching user daily emissions:", error);
            res.status(500).send("Internal Server Error");
        }
    });



    //// Endpoint to get current power consumption breakdown ////
    app.get('/current-power-consumption', async (req, res) => {
        try {
            const zoneID = StaticGlobalData.userPreferences.region; // Assuming this is the region name or identifier
            const postcodePrefix = StaticGlobalData.userPreferences.GBPostalPrefix;
            
            // Fetch the power consumption breakdown data
            const consumptionData = await cbreakdown.getCurrentPowerConsumptionBreakdown(zoneID, postcodePrefix);
            
            // Use the actual region from user preferences for the regionName
            const regionName = zoneID; // Assuming zoneID is the name or identifier of the region
    
            // Ensure the response maintains its expected structure for consumption data
            res.json({
                data: consumptionData, // Keep the original data structure
                regionName: regionName // Use the actual region name
            });
        } catch (error) {
            console.error("Failed to get current power consumption breakdown:", error);
            res.status(500).send("Server Error");
        }
    });

    app.get('/get-recycling-centres', async (req, res) => {
        try {
            const radius = 50; //radius in miles
            const count = 50; //return recycle centres
            const postcodePrefix = StaticGlobalData.userPreferences.GBPostalPrefix;
            const postcodeSuffix = StaticGlobalData.userPreferences.GBPostalSuffix;
    
            if (!postcodePrefix || !postcodeSuffix) {
                return res.status(400).send("User postcode prefix and suffix are required.");
            }
    
            const centresData = await recycle.getNearestRecyclingCentresByPostCode(postcodePrefix, postcodeSuffix, radius, count);
            res.json(centresData);
        } catch (error) {
            console.error("Failed to get recycling centres:", error);
            res.status(500).send("Server Error");
        }
    });
    
    app.get('/recycle', (req, res) => {
    
        ecoData.postcodePrefix = StaticGlobalData.userPreferences.GBPostalPrefix;
        ecoData.postcodeSuffix = StaticGlobalData.userPreferences.GBPostalSuffix;
        
        res.render("recyclingcentres", ecoData);
    });

    ////// Endpoint to get recycling centres and postcode converted into coordinates for mini map //////
    app.get('/convert-postcode-to-coordinates', async (req, res) => {
        const postcode = req.query.postcode;
        if (!postcode) {
            return res.status(400).send('Postcode is required');
        }

        try {
            const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
                params: {
                    key: '27da4a1090654b3fb665c4aa304d0b5d',
                    q: postcode,
                    pretty: 1,
                    no_annotations: 1
                }
            });
            if (response.data && response.data.results && response.data.results.length > 0) {
                const { lat, lng } = response.data.results[0].geometry;
                res.json({ latitude: lat, longitude: lng });
            } else {
                res.status(404).send('Coordinates not found');
            }
        } catch (error) {
            console.error('Error converting postcode to coordinates:', error);
            res.status(500).send('Server Error');
        }
    });

};
