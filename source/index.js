const express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const saltRounds = 10; // for bcrypt

const electricitymaps = require('./apis/electricitymaps');
const res = require('express/lib/response');
const mapbox = require('./apis/mapbox');

const app = express();
const port = 8000;

// Connection URL (replace if your MongoDB is hosted elsewhere)
const url = 'mongodb://127.0.0.1:27017';

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

var ecoData = {}
const dbName = 'Ecolution';

let db;
const client = new MongoClient(url);

app.get('/chart-data', (req, res) => {
    res.json({
        data1: [30, 200, 100, 170, 150, 250],
        data2: [130, 100, 140, 35, 110, 50]
    });
});

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
        db = client.db(dbName);
        const collection = db.collection('User_Credentials');

        app.listen(port, () => {
            console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
        });

        // Require the routes and pass the necessary arguments
        require("./js/main")(app, ecoData, db, bcrypt, saltRounds, collection);

    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
}

run();