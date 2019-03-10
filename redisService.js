var redis = require('redis');
var config = require('./config');

var redisClient;

var getRedisClient = () => {
    return new Promise((resolve, reject) => {
        if (!redisClient || !redisClient.connected) {
            var client = redis.createClient(config.redisConfig);
            client.on('connect', () => {
                redisClient = client;
                resolve(redisClient);
            });
            client.on('error', err => {
                console.log("Failed to connect to Redis");
                reject(err);
            })
        }
        else {
            console.log("Already connected");
            resolve(redisClient);
        }
    })

}

module.exports.set = (key, value) => {
    getRedisClient()
        .then(client => {
            client.set(key, value, "EX", config.expiration.time, (err, result) => {
                if (err) {
                    console.log("Failed to add key: " + key);
                }
                else {
                    console.log("Key added");
                }
            });
        })
        .catch(err => {
            console.log("Failed to connect to Redis: " + err);
        })
}

module.exports.get = key => {
    return new Promise((resolve, reject) => {
        getRedisClient()
        .then(client => {
            client.get(key, (err, value) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(value);
                }
            })
        })
        .catch(err => {
            console.log("Failed to connect to Redis: " + err);
        })
    })
}

process.on('exit', () => {
    console.log("Closing Redis connection");
    getRedisClient()
        .then(client => {
            client.quit();
        })
        .catch(err => {
            console.log("Redis connection already closed");
        })
})