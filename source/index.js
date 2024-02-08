const express = require('express');
var ejs = require('ejs');
var bodyParser= require ('body-parser');
const bcrypt = require('bcrypt');
// const { MongoClient } = require('mongodb');
// const saltRounds = 10; // for bcrypt

const electricitymaps = require('./apis/electricitymaps');
const app = express();
const port = 8000;
// Connection URL (replace if your MongoDB is hosted elsewhere)
// const url = 'mongodb://127.0.0.1:27017';

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
let collection;
// Create a new MongoClient
// const client = new MongoClient(url);

// Function to generate the chart

app.get('/chart-data', (req, res) => {
    // Provide the necessary data for the chart
    res.json({
        data1: [30, 200, 100],
        data2: [130, 100, 140]
    });
});

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./js/main")(app, ecoData, db, bcrypt,collection);

// Connect to the MongoDB cluster
async function run() {
    try {
        // await client.connect();
        // console.log("Connected successfully to server");
        // db = client.db(dbName);
        // const collection = db.collection('User_Credentials');

        // Start the server after establishing the database connection
        app.listen(port, () => {
            console.log(`ECOLUTION SVR LISTENING... PORT: ${port}!`);
        });

        // Now you can require your routes and pass the db connection
        require("./js/main")(app, ecoData);

    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
}


  // Route to display the login page
  app.get("/login", (req, res) => {
    res.render("login.ejs");
});

// Route to handle login logic
app.post("/login", async (req, res) => {
    // Extract username and password from request body
    const { username, password } = req.body;
    
    try {
        // Find user in the database within the credentials array
        const user = await db.collection('User_Credentials').findOne({ "credentials.username": username }, { projection: { credentials: { $elemMatch: { username } } } });

        if (user && user.credentials && user.credentials.length > 0) {
            // Extract the first element of the credentials array
            const userData = user.credentials[0];

            // Compare submitted password with stored hash
            console.log("   ")
            console.log(userData);
            console.log(password);
            console.log(userData.passwordHash);
            if (password === userData.password){

                // Passwords match, handle successful login
                res.send("Logged in successfully");
            } else {
                // Passwords do not match
                res.send("Incorrect password");
            }
        } else {
            // User not found
            res.send("User not found");
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error during login:", error);
        res.send("An error occurred during login");
    }
});

// Route to display the registration page
app.get("/register", (req, res) => {
    res.render("register.ejs");
  });
  
  // Route to handle registration logic
  app.post("/register", async (req, res) => {
    // Extract email, username, and password from request body
    const { email, username, password } = req.body;
    
    try {
        // Check if the user already exists
        const existingUser = await db.collection('User_Credentials').findOne({ "credentials.username": username });
  
        if (existingUser) {
            // User already exists
            res.send("User already exists with that username");
        } else {
            // Insert new user into the database
            const newUser = {
                email: email,
                username: username,
                password: password, // In a real application, you should hash the password
                createDate: new Date(), // Storing the creation date
                lastLoginDate: null, // Initially null, updated upon login
                isActive: "T" // Assuming "T" means True/Active
            };
  
            await db.collection('User_Credentials').updateOne({}, { $push: { credentials: newUser } });
  
            res.send("User registered successfully");
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error during registration:", error);
        res.send("An error occurred during registration");
    }
  });
  
run();

let test = electricitymaps.getZoneID();

