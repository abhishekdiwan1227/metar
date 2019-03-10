var https = require('https');
var config = require('../config');
var redisService = require('../redisService');

module.exports.ping = (req, res, next) => {
    res.json({ data: "pong" });
}

module.exports.getReport = (req, res, next) => {
    var stationCode = req.query.scode;
    var nocache = req.query.nocache;
    if (nocache !== undefined && nocache == 1) {
        getLiveReport(stationCode)
            .then(data => {
                res.json({ data: data });
            })
            .catch(err => {
                res.json("Failed to get data: " + err);
            })
    }
    else {
        var weatherData = redisService.get(stationCode)
            .then(val => {
                if (val) res.json({ data: JSON.parse(val) });
                else {
                    getLiveReport(stationCode)
                        .then(data => {
                            res.json({ data: data });
                        })
                        .catch(err => {
                            res.json("Failed to get data: " + err);
                        })
                }
            })
            .catch(err => {
                res.json(err);
            });
    }
}

processedMetarData = (responseData) => {
    var metarData = responseData.split('\n');
    var stationData = metarData[1].split(' ');
    return {
        station: stationData[0],
        last_observation: getLastObservationDate(metarData[0]),
        temperature: getTemperatureString(metarData[1]),
        wind: getWindString(metarData[1])
    }
}

getWindString = windData => {
    var windRegex = /([0-9]{3})([0-9]{2}G)?([0-9]{2}KT)/g;
    var wind = windRegex.exec(windData);
    if(!wind) return "Wind data not available";
    var windDirection = Math.round(parseInt(wind[1]) / 90);
    var gustingSpeed = wind[2] ? wind[2].substr(0, wind[2].indexOf('G')) + " gusting" : "0 gusting";
    var windSpeed = wind[3].substr(0, wind[3].indexOf('K'))
    switch (windDirection) {
        case (0): case(4): return "N at " + gustingSpeed + " to " + windSpeed + " knots";
        case (1): return "E at " + gustingSpeed + " to " + windSpeed + " knots";
        case (2): return "S at " + gustingSpeed + " to " + windSpeed + " knots";
        case (3): return "W at " + gustingSpeed + " to " + windSpeed + " knots";
    }
}

getTemperatureString = data => {
    var tempRegex = /(M?[0-9]{2}\/M?[0-9]{2})/g
    var tempData = tempRegex.exec(data);
    if(!tempData) return "Temperature data not available";
    var tempratureData = tempData[0].split('/')[0];
    var temprature = tempratureData[0] === 'M' ? "-" + tempratureData.substring(tempratureData.indexOf('M') + 1, tempratureData.length) : tempratureData;
    return temprature + " C";
}

getLastObservationDate = dateData => {
    var lastObservedDateTime = dateData.split(' ');
    return lastObservedDateTime[0] + " at " + lastObservedDateTime[1] + " GMT";
}

getLiveReport = stationCode => {
    var url = config.urls.metar + stationCode + ".TXT";
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            var responseData = "";
            response.on('data', stream => {
                responseData = responseData + stream;
            })

            response.on('end', () => {
                weatherData = processedMetarData(responseData);
                redisService.set(weatherData.station, JSON.stringify(weatherData));
                resolve(weatherData);
            })

            response.on('error', err => {
                reject(err);
            })
        });
    })

}