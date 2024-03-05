// Immutable constants such as fixed figures that we can reference across the app

// avgCO2eMT_driven_per_mile = Average CO2e emissions in metric tons per mile driven
// avgAcceptableWalkingDist_mile = Average acceptable walking distance in miles
const StaticGlobalData = {avgCO2eMT_driven_per_mile : 0.0002214, avgAcceptableWalkingDist_mile : 0.7};

// User preferences that are loaded into the session and cached here for easier referencing
var userPreferences = null;

// User saved data that is loaded into the session and cached here for easier referencing
var userSavedData = null;

module.exports = StaticGlobalData;