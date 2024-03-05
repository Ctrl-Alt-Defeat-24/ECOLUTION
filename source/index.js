const express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const saltRounds = 10; // for bcrypt

const res = require('express/lib/response');
const e = require('express');
const mapbox = require('./apis/mapbox');
const electricityMaps = require('./apis/electricitymaps');
const nationalgrid = require('./apis/nationalgrid');
const recycle = require('./js/gb_recyclecentres');
const cbreakdown = require('./js/carbonbreakdown');
const MQL = require('./js/MQL');
const StaticGlobalData = require('./client/js/ecolutionclientlib');

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
        const zoneID = StaticGlobalData.userPreferences.region;
        const postcodePrefix = StaticGlobalData.userPreferences.GBPostalPrefix; 
        const data = await cbreakdown.getCurrentPowerConsumptionBreakdown(zoneID, postcodePrefix);
        res.json(data);
    } catch (error) {
        console.error("Failed to get current power consumption breakdown:", error);
        res.status(500).send("Server Error");
    }
});




// Endpoint to get recycling centres
app.get('/get-recycling-centres', async (req, res) => {
    try {
        const postcodePrefix = StaticGlobalData.userPreferences.GBPostalPrefix;
        const postcodeSuffix = StaticGlobalData.userPreferences.GBPostalSuffix;
        const radius = 50; //radius in miles
        const count = 50; //return recycle centres

        const centresData = await recycle.getNearestRecyclingCentresByPostCode(postcodePrefix, postcodeSuffix, radius, count);
        res.json(centresData);
    } catch (error) {
        console.error("Failed to get recycling centres:", error);
        res.status(500).send("Server Error");
    }
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
