// UK NATIONAL GRID API
// https://carbon-intensity.github.io/api-definitions

const GB_nationalGrid = {
    // Narrows the power breakdown to the specific postal region instead of national
    getPowerConsumptionBreakdownByPostCode: async function (prefixpostcode, callback) {
      const endpoint = `https://api.carbonintensity.org.uk/regional/postcode/${prefixpostcode}`;
      const options = {
        method: "GET",
      };
  
      fetch(endpoint, options)
        .then((response) => response.json())
        .then((data) => {
          //console.log(data);
          callback(null, data);
        })
        .catch((error) => {
          console.error("MapBox API Callback Error: " + error);
          callback(error, null);
        });
    },
  };
  
  module.exports = GB_nationalGrid;