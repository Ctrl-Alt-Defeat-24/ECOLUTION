// This JS Module allows us to create a middleman to organize the MongoDB function calls and pass params into and out for server JS files

const res = require("express/lib/response");
const { MongoClient } = require('mongodb');

// This is the URL for the MongoDB hosted on MongoDB Atlas
const url = 'mongodb+srv://UrbanR:fD9Zdwdk63UxzOUh@ecolution.4v9i1rl.mongodb.net/?retryWrites=true&w=majority';
// THe name of the database that we're going to be using
const dbName = 'Ecolution';
// Init to null so we can check if we've already initialized the DB
var db = null;
// Create a client instance to connect to the server
const client = new MongoClient(url);

const mql = {
    // Get MongoDB instance connection
    getMongoDBInstance : function() {
        return new Promise(async (resolve) => {
            // If we've already initialized the DB then just return it
            if (db != null) {
                resolve(db);
            } else {
                // Start a connection to the server
                console.log("Starting MongoDB Connection...");
                await client.connect();
                db = client.db(dbName);
                console.log("Connected to MongoDB!");
                resolve(db);
            }
        });
    },

    // Get the users' preferences based on their username
    getUserPreferences : async function(username) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_Preferences');
                // Find the users preferences based on the username
                console.log("Fetching user preferences for: ", username)
                try {
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    console.log(user);
                    resolve(user);
                } catch (error) {
                    // Handle errors
                    console.error("Error fetching user preferences: ", error);
                    reject(error);
                }
            // If we couldnt retrieve the DB instance then we need to log the error and reject the promise
            }).catch((error) => {
                console.error("Error fetching user preferences: ", error);
                reject(error);
            });
        });
    },

    getUserSavedData : async function(username) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_SavedData');
                // Find the users preferences based on the username
                console.log("Fetching user preferences for: ", username)
                try {
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    console.log(user);
                    resolve(user);
                } catch (error) {
                    // Handle errors
                    console.error("Error fetching user saved data: ", error);
                    reject(error);
                }
            // If we couldnt retrieve the DB instance then we need to log the error and reject the promise
            }).catch((error) => {
                console.error("Error fetching user saved data: ", error);
                reject(error);
            });
        });
    },

    // This function adds a given emission(eMT) to the users standing amount
    AddToTotalEmission : async function(username, emissionToAdd) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_SavedData');
                // Find the users preferences based on the username
                console.log("Fetching user preferences for: ", username)
                try {
                    // Just make sure that we're sending a valid number
                    if(emissionToAdd < 0 || isNaN(emissionToAdd)){
                        throw new Error("Invalid emission value");
                    }
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    console.log("Updating Emissions for user: " + username)
                    // Add the new value ontop of the user's current amount
                    collection.updateOne({ _id: username }, { $set: { _id: username, totalEstCO2eMT: user.totalEstCO2eMT + emissionToAdd } });
                    // return true to show it was successful in updating
                    resolve(true);
                } catch (error) {
                    // Handle errors
                    console.error("Error fetching user saved data:", error);
                    resolve(false);
                }
            // If we couldnt retrieve the DB instance then we need to log the error and reject the promise
            }).catch((error) => {
                console.error("Error fetching user saved data:", error);
                reject(error);
            });
        });
    }
};

module.exports = mql;