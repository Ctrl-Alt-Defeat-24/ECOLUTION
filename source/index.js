const express = require('express');
var ejs = require('ejs');
var bodyParser= require ('body-parser');

const electricitymaps = require('./apis/electricitymaps');
const app = express();
const port = 8000;

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

// Define our data
var ecoData = {}

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

app.listen(port, () => console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`));

let test = electricitymaps.getZoneID();