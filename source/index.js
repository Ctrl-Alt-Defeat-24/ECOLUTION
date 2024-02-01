const express = require('express');
var ejs = require('ejs');
var bodyParser= require ('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const saltRounds = 10; // for bcrypt

const electricitymaps = require('./apis/electricitymaps');
const res = require('express/lib/response');
const mapbox = require('./apis/mapbox');

const app = express();
const port = 8000;
// Connection URL (replace if your MongoDB is hosted elsewhere)
const url = 'mongodb://127.0.0.1:27017';

app.use(express.static(__dirname + "/typefaces"));
app.use(express.json());
app.use(express.static(__dirname + "/client"));

// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine('html', ejs.renderFile);

// Tell Express where to find static files
// Static files are files that will not change
app.use(express.static('public')); // Serve static files from the 'public' folder

// Tell Express to use the body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Define our data
var ecoData = {}

// Database Name
const dbName = 'Ecolution';

let db;
// Create a new MongoClient
const client = new MongoClient(url);

// Function to generate the chart
app.get('/chart-data', (req, res) => {
    // Provide the necessary data for the chart
    res.json({
        data1: [30, 200, 100, 170, 150, 250],
        data2: [130, 100, 140, 35, 110, 50]
    });
});

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./js/main")(app, ecoData);

// Connect to the MongoDB cluster
async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
        db = client.db(dbName);
        const collection = db.collection('User_Credentials');

        // Start the server after establishing the database connection
        app.listen(port, () => {
            console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
        });

        // Now you can require your routes and pass the db connection
        require("./js/main")(app, ecoData, db, bcrypt, saltRounds, collection);

    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
}
app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

app.post("/login", async (req, res) => {
    // Authentication logic for login
    const { username, password } = req.body;
    const user = await db.collection('User_Credentials').findOne({ username });
    
    if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.send("Logged in successfully");
        } else {
            res.send("Incorrect password");
        }
    } else {
        res.send("User not found");
    }
  });

run();

// Bypass MongoDB connection
// app.listen(port, () => {
//     console.log(`BYPASSED MONGODB TO START ECOLUTION SVR... LISTENING... PORT: ${port}!`);
// });