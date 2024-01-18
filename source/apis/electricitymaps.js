// ELECTRICITY MAPS API
// https://api-portal.electricitymaps.com/

module.exports = {
    getZoneID: async function () {
        const options = {
            method: 'GET',
            headers: {
              'auth-token': 'XY7TPdKc9UIQfFqDYczFyAEv4uAiv1G5'
            },
          };
          
          fetch('https://api-access.electricitymaps.com/free-tier/zones', options)
            .then(response => response.json())
            .then(response => console.log(response))
            .catch(err => console.error(err));
    }
}
