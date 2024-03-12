const express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const saltRounds = 10; // for bcrypt
const passport = require('passport');

const res = require('express/lib/response');
const e = require('express');
const mapbox = require('./apis/mapbox');
const electricityMaps = require('./apis/electricitymaps');
const nationalgrid = require('./apis/nationalgrid');
const recycle = require('./js/gb_recyclecentres');
const cbreakdown = require('./js/carbonbreakdown');
const MQL = require('./js/MQL');
const StaticGlobalData = require('./client/js/ecolutionclientlib');
const axios = require('axios');

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

app.get('/chart-data', async (req, res) => {
    let numberValue;
    try {
        // Assuming you need to pass a username to these functions
        // and that "username" is somehow retrieved (e.g., from query params)
        const username = req.session.username; // Example: get username from query params

        const data1 = await MQL.getUserAllDailyEmissions(username);
        const data2 = [0];
    
        // Assuming emissionsData has the structure similar to: [['2024-03-12', '0.16139221116766725']]
        // and you're interested in the second element of the first inner array ([0][1]).
        if (data1.length > 0 && data1[0].length > 1) {
            const numberString = data1[0][1]; // Accessing the numerical string
            numberValue = [parseFloat(numberString)]; // Converting the string to a floating point number
            
            console.log(numberValue); // Use the number as needed
        } else {
            console.error('Emissions data is not in the expected format or is empty');
        }

        res.json( {numberValue,data2});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
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




////// Endpoint to get recycling centres and postcode converted into coordinates for mini map //////
//Users postcode
//User Preferences postcode: StaticGlobalData.userPreferences.GBPostalPrefix;
//StaticGlobalData.userPreferences.GBPostalSuffix;
// const postcodePrefix = "E17";
// const postcodeSuffix = "7JP";

//OpenCage API key for postcode - coordinates converter for mini map
const opencageApiKey = '27da4a1090654b3fb665c4aa304d0b5d';
app.get('/convert-postcode-to-coordinates', async (req, res) => {
    const postcode = req.query.postcode;
    if (!postcode) {
        return res.status(400).send('Postcode is required');
    }

    try {
        const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
            params: {
                key: opencageApiKey,
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


//Endpoint for recycle centres
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
