// This JS Module allows us to create a middleman to organize the MongoDB function calls and pass params into and out for server JS files

const res = require("express/lib/response");
const { MongoClient } = require('mongodb');
const StaticGlobalData = require("../client/js/ecolutionclientlib");

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

    // This function updates the users' preferences based on the username, it also handles any new users
    updateUserPreferences : async function(username, avgAcceptableWalkingDist_mile, GBPostalPrefix, GBPostalSuffix, region, publicProfile) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_Preferences');
                // Find the users preferences based on the username
                console.log("Fetching user preferences for: ", username)
                try {
                    // Just make sure that we're sending a valid inputs
                    const tempAvgAcceptableWalkingDist_mile = parseFloat(avgAcceptableWalkingDist_mile) > 0 ? parseFloat(avgAcceptableWalkingDist_mile) : StaticGlobalData.avgAcceptableWalkingDist_mile;
                    const tempGBPostalPrefix = GBPostalPrefix.length > 0 ? GBPostalPrefix : "E17";
                    const tempGBPostalSuffix = GBPostalSuffix.length > 0 ? GBPostalSuffix : "7JP";
                    const tempRegion = region.length > 0 ? region : "GB";
                    const tempPublicProfile = publicProfile.length > 0 ? publicProfile : "true";
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    if(user){
                        console.log("Updating Emissions for user: " + username)
                        // Update all values with the new ones
                        collection.updateOne({ _id: username }, { $set: { _id: username, avgAcceptableWalkingDist_mile: tempAvgAcceptableWalkingDist_mile, avgCO2eMT_driven_per_mile: 0.0002214, 
                            GBPostalPrefix: tempGBPostalPrefix, GBPostalSuffix: tempGBPostalSuffix, region: tempRegion, publicProfile: tempPublicProfile } });
                        // return true to show it was successful in updating
                        resolve(true);
                    } else {
                        console.log("Creating new user preferences for: " + username)
                        // Create a new user preferences entry
                        collection.insertOne({ _id: username, avgAcceptableWalkingDist_mile: tempAvgAcceptableWalkingDist_mile, avgCO2eMT_driven_per_mile: 0.0002214, 
                            GBPostalPrefix: tempGBPostalPrefix, GBPostalSuffix: tempGBPostalSuffix, region: tempRegion, publicProfile: tempPublicProfile });
                        // return true to show it was successful in updating
                        resolve(true);
                    }
                } catch (error) {
                    // Handle errors
                    console.error("Error fetching user preferences:", error);
                    resolve(false);
                }
            // If we couldnt retrieve the DB instance then we need to log the error and reject the promise
            }).catch((error) => {
                console.error("Error fetching user preferences:", error);
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

    getUserAllDailyEmissions : async function(username) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_SavedData');
                // Find the users preferences based on the username
                console.log("Fetching user preferences for: ", username)
                try {
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    var allDailyEmissions = [];
                    if(user.activityDailyEmissions.length > 0){
                        for(var i = 0; i < user.activityDailyEmissions.length; i++){
                            allDailyEmissions.push([user.activityDailyEmissions[i].split(':')[0], user.activityDailyEmissions[i].split(':')[1]]); 
                        }
                    } else {
                        allDailyEmissions.push([new Date().toISOString().split('T')[0], 0]);
                    }
                    console.log(allDailyEmissions);
                    resolve(allDailyEmissions);
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
                console.log("Fetching user saved data for: ", username)
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
    },

    // This function adds a given emission(eMT) to the users daily amount
    AddToDailyEmissions : async function(username, emissionToAdd) {
        return new Promise((resolve, reject) => {
            this.getMongoDBInstance().then(async (db) => {
                // Establish the collection of interest
                const collection = db.collection('User_SavedData');
                // Find the users preferences based on the username
                console.log("Fetching user saved data for: ", username)
                try {
                    // Just make sure that we're sending a valid number
                    if(emissionToAdd < 0 || isNaN(emissionToAdd)){
                        throw new Error("Invalid emission value");
                    }
                    // Get the value from the collection
                    const user = await collection.findOne({ _id: username });
                    var modifiedActivityDailyEmissions = user.activityDailyEmissions;

                    //Split the date to check if we're adding to the same day
                    var date = new Date().toISOString();
                    date = date.split('T')[0];

                    // If the user has any previous daily emissions then we need to check if we're adding to the same day
                    if(modifiedActivityDailyEmissions.length > 0){
                        //Split the date and emissions
                        const tempDate = modifiedActivityDailyEmissions[modifiedActivityDailyEmissions.length - 1].split(':')[0];
                        //console.log(date + "  " + tempDate);
                        const tempEmissions = modifiedActivityDailyEmissions[modifiedActivityDailyEmissions.length - 1].split(':')[1];
                        if(tempDate == date){
                            // Add the new value ontop of the user's current amount
                            const newEmissions = parseFloat(tempEmissions) + emissionToAdd;
                            //console.log(newEmissions);
                            // Update the last entry in the array
                            modifiedActivityDailyEmissions[modifiedActivityDailyEmissions.length - 1] = tempDate + ":" + newEmissions;
                        } else {
                            // If the user has no previous daily emissions then we need to add the first entry
                            modifiedActivityDailyEmissions.push(date + ":" + emissionToAdd);
                        }
                    } else {
                        // If the user has no previous daily emissions then we need to add the first entry
                        modifiedActivityDailyEmissions.push(date + ":" + emissionToAdd);
                    }

                    console.log("Updating Daily Emissions for user: " + username)
                    console.log(modifiedActivityDailyEmissions);
                    // Replace the whole array with the new one
                    collection.updateOne({ _id: username }, { $set: { _id: username, activityDailyEmissions: modifiedActivityDailyEmissions } });
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