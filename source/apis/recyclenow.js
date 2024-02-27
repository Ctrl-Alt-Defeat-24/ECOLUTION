// RECYCLE NOW API
// https://www.recyclenow.com/recycling-locator

const GB_recyclingCentres = {
  // Takes in a postcode and returns the nearest recycling centres, exclusive to GB region
  getNearestRecyclingCentresByPostCode: async function (prefixpostcode, suffixpostcode, radius, maxcount, callback) {
    const endpoint = `https://rl.recyclenow.com/widget/www.recyclenow.com/locations/${prefixpostcode}%20${suffixpostcode}?limit=${maxcount == 0 ? 20 : maxcount}&radius=${radius == 0 ? 25 : radius}&callback=jQuery351043160988984432147_1709040309837&_=1709040309873`;
    //const endpoint = `https://rl.recyclenow.com/widget/www.recyclenow.com/locations/${prefixpostcode}%20${suffixpostcode}?limit=5&radius=25&callback=jQuery351043160988984432147_1709040309837&_=1709040309873`;
    const options = {
      method: "GET",
    };

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Recycle Now API Fetch Error: ${response.status}`);
      }
      
      // Get our text data
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      //console.log(text);
      // Sanitize the data to get the JSON
      const startIndex = text.indexOf('(');
      const endIndex = text.lastIndexOf(')');
      const jsonText = text.substring(startIndex + 1, endIndex);
      callback(null, JSON.parse(jsonText));

    } catch (error) {
      console.error("Recycle Now API Callback Error: " + error);
      if (typeof callback === 'function') {
        callback(error, null);
      }
    }
  }
};

module.exports = GB_recyclingCentres;
