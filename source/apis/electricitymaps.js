// ELECTRICITY MAPS API
// https://api-portal.electricitymaps.com/

module.exports = {
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
            console.error(error);
        }
    }
}
