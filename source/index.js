const express = require("express");
var ejs = require("ejs");
var bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const session = require("express-session");
const saltRounds = 10; // for bcrypt
const passport = require("passport");

const res = require("express/lib/response");
const e = require("express");
const mapbox = require("./apis/mapbox");
const electricityMaps = require("./apis/electricitymaps");
const nationalgrid = require("./apis/nationalgrid");
const recycle = require("./js/gb_recyclecentres");
const cbreakdown = require("./js/carbonbreakdown");
const MQL = require("./js/MQL");
const StaticGlobalData = require("./client/js/ecolutionclientlib");
const axios = require("axios");

const app = express();
const port = 8000;

// Set the directory where Express will pick up HTML files
app.set("views", __dirname + "/views");

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs");

app.engine("html", ejs.renderFile);

// Static files
app.use(express.static(__dirname + "/typefaces"));
app.use(express.json());
app.use(express.static(__dirname + "/client"));
app.use(express.static("public"));

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "Sx^hC+z@EK.gPc~",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// This is where any arrays or temporary data will be stored for use at the front end
var ecoData = {};

// Start the server up by initializing the server and then listening on the port
MQL.getMongoDBInstance().then(async (db) => {
  app.listen(port, async () => {
    console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
  });

  // Require the routes and pass the necessary arguments
  require("./js/main")(app, ecoData, bcrypt, saltRounds);
});
