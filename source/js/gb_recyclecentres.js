// This JS Module allows us to create a middleman to organize function calls from APIs and pass them to the EJS template

const res = require("express/lib/response");
const GB_recyclingCentres = require("../apis/recyclenow");
const StaticGlobalData = require("../client/js/ecolutionclientlib");

// Material types, sometimes the API does not provide accurate or relevant material types so we have to manually sanitze them
const materialsTypes = {
28:"Batteries",
26:"Makeup Plastic",
52:"Clothing", 53:"Household Items", 54:"Shoes & Bags", 
64:"Mobile Phones", 107:"Routers", 
123:"Makeup Plastic", 124:"Makeup Plastic", 125:"Makeup Plastic", 126:"Makeup Plastic", 127:"Makeup Plastic", 128:"Makeup Plastic", 129:"Makeup Plastic",
};

const ecolutionGB_RecyclingCentres = {

    // This function cleans up the materials array and returns a sanitized version of it so that it can be easily used in the front end
    
    //This one is commented out, text errors like repeating texts keep appearing, below is a fixed version to stop that, code is a temporary keep 
    // sanitizeMaterials : function(materials) {
    //     if (!Array.isArray(materials)) {
    //         return materials;
    //     }
    //     // Create a new array to store the sanitized materials
    //     var sanitizedMaterials = [];
    //     for (var i = 0; i < materials.length; i++) {
    //         var material = materials[i];
    //         // Check to see if the material category is already defined to be used
    //         if (typeof material === 'object' && material.category) {
    //             sanitizedMaterials.push(material.name);
    //         // Check to see if we have a number and if it's in our defined list of materials
    //         } else if (typeof material === 'number' && materialsTypes[material]) {
    //             sanitizedMaterials.push(materialsTypes[material]);
    //         // Return an "Other" if we dont have it defined in either list or as an object
    //         } else {
    //             sanitizedMaterials.push("Other, please check the recycling point for more details");
    //         }
    //     }
    //     return sanitizedMaterials;
    // },
    
    //Working version
    sanitizeMaterials: function(materials) {
        if (!Array.isArray(materials)) {
            return materials;
        }
        // Create a new array to store the sanitized materials
        var sanitizedMaterials = [];
        for (var i = 0; i < materials.length; i++) {
            var material = materials[i];
            var materialName;
            // Check to see if the material category is already defined to be used
            if (typeof material === 'object' && material.category) {
                materialName = material.name;
            // Check to see if we have a number and if it's in our defined list of materials
            } else if (typeof material === 'number' && materialsTypes[material]) {
                materialName = materialsTypes[material];
            // Use a generic "Other" if we don't have it defined in either list or as an object
            } else {
                materialName = "Other, please check the recycling point for more details";
            }
    
            // Add the material name only if it's not already included to avoid repetition
            if (!sanitizedMaterials.includes(materialName)) {
                sanitizedMaterials.push(materialName);
            }
        }
        return sanitizedMaterials;
    },
    
    

    // This function takes optional params of a postcode and a radius and produces a list of recycling centres within the radius of the postcode
    getNearestRecyclingCentresByPostCode : function(prefix, suffix, radius, count) {
        return new Promise((resolve, reject) => {
            GB_recyclingCentres.getNearestRecyclingCentresByPostCode(prefix, suffix, radius, count, (error, result) => {
                if (error) {
                    console.error("Error fetching nearest recycle centres, check params:", error);
                    console.error("Params:", prefix, suffix, radius, count);
                    reject(error);
                } else {
                    var cleanedData = [];
                    
                    // Loop through the results and disregard any useless info
                    for(var i = 0; i < result.items.length; i++){
                        const cleanedMaterials = this.sanitizeMaterials(result.items[i].materials);
                        cleanedData.push({
                            name: result.items[i].name,
                            address: result.items[i].address_full == null ? result.items[i].address : result.items[i].address_full,
                            latitude: result.items[i].latitude,
                            longitude: result.items[i].longitude,
                            distance: result.items[i].distance,
                            materials: cleanedMaterials,
                        });
                    }
                    console.log(cleanedData);
                    resolve(cleanedData);
                }
            });
        });
    }
};

module.exports = ecolutionGB_RecyclingCentres;