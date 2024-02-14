// This JS Module allows us to create a middleman to organize function calls from APIs and pass them to the EJS template

const res = require("express/lib/response");
const GB_nationalGrid = require("../apis/nationalgrid");
const electricityMaps = require("../apis/electricitymaps");
const StaticGlobalData = require("../client/js/ecolutionclientlib");

const ecolutionCarbonBreakdown = {
    // This function takes in an optional param of a postcode and produces either a high or low accuracy estimate of the generational mix of the user's region

    // Since this is using 2 different APIs, the return order and subobjects are different and we need to format it properly, the proposed format is:

    // nationalgrid - biomass, coal, imports, gas, nuclear, other, hydro, solar, wind
    // emaps - batterydischarge, biomass, coal, gas, geothermal, hydro, hyrodischarge, nuclear, oil, solar, unknown, wind

    // Formatted = biomass, coal, gas, nuclear, hydro, solar, wind, other
    // other for nationalgrid = imports,other
    // other for emaps = unknown,oil,batterydischarge,geothermal

    getCurrentPowerConsumptionBreakdown : function(zoneID, postcode) {
        return new Promise((resolve, reject) => {
            // Check to see if we have entered a postcode first (cannot be determined or fixed size as prefixes come in different forms, e.g. "SW1" or "SW1A")
            if(postcode.length > 0){
                GB_nationalGrid.getPowerConsumptionBreakdownByPostCode(postcode, (error, result) => {
                    if (error) {
                        // If we have an error trying to get postal data, we'll just get the regional data instead
                        console.error("Error in fetching postcode data:", error);
                        console.log("Falling back to regional data");
                        getCurrentPowerConsumptionBreakdown(zoneID, "");
                    } else {
                        const uncleanedMix = (result.data[0].data[0].generationmix);
                        var cleanedMix = [];

                        cleanedMix.push({fuel: "biomass", percentage: uncleanedMix[0].perc});
                        cleanedMix.push({fuel: "coal", percentage: uncleanedMix[1].perc});
                        cleanedMix.push({fuel: "gas", percentage: uncleanedMix[3].perc});
                        cleanedMix.push({fuel: "nuclear", percentage: uncleanedMix[4].perc});
                        cleanedMix.push({fuel: "hydro", percentage: uncleanedMix[6].perc});
                        cleanedMix.push({fuel: "solar", percentage: uncleanedMix[7].perc});
                        cleanedMix.push({fuel: "wind", percentage: uncleanedMix[8].perc});
                        cleanedMix.push({fuel: "other", percentage: uncleanedMix[5].perc + uncleanedMix[2].perc});

                        //console.log(cleanedMix);
                        resolve(cleanedMix);
                    }
                });
            // Lower accuracy, estimation of regional-wide power consumption
            } else {
                electricityMaps.getLatestPowerBreakdown(zoneID, (error, result) => {
                    if (error) {
                        console.error("Error fetching regional power breakdown:", error);
                        reject(error);
                    } else {
                        const uncleanedMix = (result.powerConsumptionBreakdown);
                        var cleanedMix = [];
                        // Need to do a sum of all the mixes as we dont get the result as a percentage
                        var sumMix = 0;
                        for (var amount in uncleanedMix) {
                            sumMix += uncleanedMix[amount];
                        }
                        
                        cleanedMix.push({fuel: "biomass", percentage: (uncleanedMix.biomass / sumMix) * 100});
                        cleanedMix.push({fuel: "coal", percentage: (uncleanedMix.coal / sumMix) * 100});
                        cleanedMix.push({fuel: "gas", percentage: (uncleanedMix.gas / sumMix) * 100});
                        cleanedMix.push({fuel: "nuclear", percentage: (uncleanedMix.nuclear / sumMix) * 100});
                        cleanedMix.push({fuel: "hydro", percentage: ((uncleanedMix.hydro + uncleanedMix['hydro discharge']) / sumMix) * 100});
                        cleanedMix.push({fuel: "solar", percentage: (uncleanedMix.solar / sumMix) * 100});
                        cleanedMix.push({fuel: "wind", percentage: (uncleanedMix.wind / sumMix) * 100});
                        cleanedMix.push({fuel: "other", percentage: (uncleanedMix.unknown / sumMix) * 100 + (uncleanedMix.oil / sumMix) * 100 + (uncleanedMix['battery discharge'] / sumMix) * 100 + (uncleanedMix.geothermal / sumMix) * 100});

                        //console.log(cleanedMix);
                        resolve(cleanedMix);
                    }
                });
            }
        });
    }
};

module.exports = ecolutionCarbonBreakdown;