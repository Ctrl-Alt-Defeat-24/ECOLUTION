// MAPBOX API
// https://docs.mapbox.com/mapbox-gl-js/guides/

const mapBoxAuthToken =
  "pk.eyJ1IjoicHJpbWFscmV4IiwiYSI6ImNscmFrbWg2cjBjbDUyaW13dmxjeG96bXoifQ.ktWyvNqeJ4awZ2pu__T1Xw";

const mapBox = {
  // Fetches a route with information about the route, uses coordinates for start and end
  getRoute: async function (start, end, mode, callback) {
    const endpoint = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapBoxAuthToken}`;
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

module.exports = mapBox;
