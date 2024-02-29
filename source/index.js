const express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const saltRounds = 10; // for bcrypt
const passport = require('passport');
var userProfile;
const GOOGLE_CLIENT_ID ="736230719726-u4c6ik0sscous4930ruld7i0h20dflb4.apps.googleusercontent.com";
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_SECRET = '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';

const res = require('express/lib/response');
const e = require('express');
const mapbox = require('./apis/mapbox');
const electricityMaps = require('./apis/electricitymaps');
const nationalgrid = require('./apis/nationalgrid');
const recycle = require('./js/gb_recyclecentres');
const cbreakdown = require('./js/carbonbreakdown');
const MQL = require('./js/MQL');

const app = express();
const port = 8000;

// Set the directory where Express will pick up HTML files
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

app.engine('html', ejs.renderFile);

// Static files
app.use(express.static(__dirname + "/typefaces"));
app.use(express.json());
app.use(express.static(__dirname + "/client"));
app.use(express.static('public'));

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'Sx^hC+z@EK.gPc~',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken); // Log the token
    console.log(profile); // Log the user's profile information
      userProfile=profile;
      return done(null, userProfile);
  }
));
app.use(passport.initialize());
app.use(passport.session());


// This is where any arrays or temporary data will be stored for use at the front end
var ecoData = {}

// Test data for chart gui
app.get('/chart-data', (req, res) => {
    res.json({
        data1: [30, 200, 100],
        data2: [130, 100, 140]
    });
});


//// Endpoint to get current power consumption breakdown ////
app.get('/current-power-consumption', async (req, res) => {
    try {
        const zoneID = ""; // set this based on your application's needs
        const postcode = ""; // This could come from the user's input or session
        const data = await cbreakdown.getCurrentPowerConsumptionBreakdown(zoneID, postcode);
        res.json(data);
    } catch (error) {
        console.error("Failed to get current power consumption breakdown:", error);
        res.status(500).send("Server Error");
    }
});

// Endpoint to get recycling centres
app.get('/get-recycling-centres', async (req, res) => {
    try {
        const postcodePrefix = "E17"; // This could come from the user's input or session
        const postcodeSuffix = "7JN"; // This could come from the user's input or session
        const radius = 25; // You can adjust this as needed
        const count = 30; // You can adjust this as needed

        const centresData = await recycle.getNearestRecyclingCentresByPostCode(postcodePrefix, postcodeSuffix, radius, count);
        res.json(centresData);
    } catch (error) {
        console.error("Failed to get recycling centres:", error);
        res.status(500).send("Server Error");
    }
});

app.get('/success', (req, res) => res.send(userProfile));

app.get('/error', (req, res) => res.send('error logging in'));

passport.serializeUser(function(user, cb) {
    cb(null, user);
  });  

  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
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

// Successful authentication, redirect success.
res.redirect('/success');
});
  


// Start the server up by initializing the server and then listening on the port
MQL.getMongoDBInstance().then(async (db) => {
    app.listen(port, async () => {
        console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
        // Example invoked to view some data from the recycling API
        // recycle.getNearestRecyclingCentresByPostCode("E17", "7JN", 25, 30);
    });

    // Require the routes and pass the necessary arguments
    require("./js/main")(app, ecoData, bcrypt, saltRounds);
});
