const express = require('express');
var ejs = require('ejs');
var bodyParser= require ('body-parser');

const electricitymaps = require('./apis/electricitymaps');
const res = require('express/lib/response');
const mapbox = require('./apis/mapbox');

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

// Define our data
var ecoData = {}

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./js/main")(app, ecoData);

app.listen(port, () => console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`));

// This is how you can take this data and use it in a separate variable and then access it
// electricitymaps.getZoneID((error, result) => {
//     if (error) {
//         console.error("Error fetching data:", error);
//     } else {
//         console.log(result);
//         for (const countryCode in result) {
//             const countryInfo = result[countryCode];
//             console.log(countryCode, countryInfo.zoneName, countryInfo.access);
//         }        
//     }
// });

mapbox.getRoute([-121.677738,46.522458], [-122.677738,45.522458], "walking", (error, result) => {
    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log(result);   
    }
});