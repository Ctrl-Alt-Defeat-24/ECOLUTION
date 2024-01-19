// ELECTRICITY MAPS API
// https://api-portal.electricitymaps.com/

module.exports = {
    // Gets all the possible Zone IDs, useful for allowing the user to select a zone on setup
    getZoneID: async function () {
        const endpoint = 'https://api-access.electricitymaps.com/free-tier/zones';
        const options = {
            method: 'GET',
            headers: {
                'auth-token': 'XY7TPdKc9UIQfFqDYczFyAEv4uAiv1G5'
            },
        };

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("ElectricityMaps API Callback Error: " + error);
        }
    }
}

module.exports = {
    // Gets the latest power breakdown for a given zone
    getLatestPowerBreakdown: async function (zone) {
        const endpoint = 'https://api-access.electricitymaps.com/free-tier/power-breakdown/latest?zone=' + zone;
        const options = {
            method: 'GET',
            headers: {
                'auth-token': 'XY7TPdKc9UIQfFqDYczFyAEv4uAiv1G5'
            },
        };

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("ElectricityMaps API Callback Error: " + error);
        }
    }
}
