// ELECTRICITY MAPS API
// https://api-portal.electricitymaps.com/

const electricityMapsAuthToken = 'XY7TPdKc9UIQfFqDYczFyAEv4uAiv1G5';

const electricityMaps = {
    // Gets all the possible Zone IDs, useful for allowing the user to select a zone on setup
    getZoneID: async function (callback) {
        const endpoint = 'https://api-access.electricitymaps.com/free-tier/zones';
        const options = {
            method: 'GET',
            headers: {
                'auth-token': electricityMapsAuthToken
            },
        };

        fetch(endpoint, options)
            .then(response => response.json())
            .then(data => {
                //console.log(data);
                callback(null, data);
            })
            .catch(error => {
                console.error("ElectricityMaps API Callback Error: " + error);
                callback(error, null);
            });
    },

    // Gets the latest power breakdown for a given zone
    getLatestPowerBreakdown: async function (zone, callback) {
        const endpoint = 'https://api-access.electricitymaps.com/free-tier/power-breakdown/latest?zone=' + zone;
        const options = {
            method: 'GET',
            headers: {
                'auth-token': electricityMapsAuthToken
            },
        };

        fetch(endpoint, options)
            .then(response => response.json())
            .then(data => {
                //console.log(data);
                callback(null, data);
            })
            .catch(error => {
                console.error("ElectricityMaps API Callback Error: " + error);
                callback(error, null);
            });
    },

    // Gets the latest power breakdown for a given zone
    getLatestCarbonIntensity: async function (zone, callback) {
        const endpoint = 'https://api-access.electricitymaps.com/free-tier/carbon-intensity/latest?zone=' + zone;
        const options = {
            method: 'GET',
            headers: {
                'auth-token': electricityMapsAuthToken
            },
        };

        fetch(endpoint, options)
            .then(response => response.json())
            .then(data => {
                //console.log(data);
                callback(null, data);
            })
            .catch(error => {
                console.error("ElectricityMaps API Callback Error: " + error);
                callback(error, null);
            });
    }
};

module.exports = electricityMaps;
