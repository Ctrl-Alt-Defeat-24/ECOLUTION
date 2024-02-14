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
const cbreakdown = require('./js/carbonbreakdown');

const app = express();
const port = 8000;

// Connection URL (replace if your MongoDB is hosted elsewhere)
// const url = 'mongodb://127.0.0.1:27017';
const url = 'mongodb+srv://UrbanR:fD9Zdwdk63UxzOUh@ecolution.4v9i1rl.mongodb.net/?retryWrites=true&w=majority';

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
const dbName = 'Ecolution';

let db;
const client = new MongoClient(url);

app.get('/chart-data', (req, res) => {
    res.json({
        data1: [30, 200, 100],
        data2: [130, 100, 140]
    });
});

// Request the powerbreakdown, use the data from here to populate the chart
// electricityMaps.getLatestPowerBreakdown("GB", (error, data) => {
//     if (error) {
//         console.error("Error fetching data:", error);
//     } else {
//         console.log(data);
//     }
// });

// nationalgrid.getPowerConsumptionBreakdownByPostCode("E17", (error, data) => {
//     if (error) {
//         console.error("Error fetching data:", error);
//     } else {
//         console.log(data);
//     }
// });

cbreakdown.getCurrentPowerConsumptionBreakdown("GB", "");

// Connect to DB and start the server
async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
        db = client.db(dbName);
        // Get a reference to the User_Credentials collection
        const credential_collection = db.collection('User_Credentials');

        app.listen(port, () => {
            console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
        });

        // Require the routes and pass the necessary arguments
        require("./js/main")(app, ecoData, db, bcrypt, saltRounds, credential_collection);

    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
}

run();
