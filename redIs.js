// Including the Required Modules
const redis = require('redis');
// const { rport } = require('./config');
const { rport } = require('./configRedis');

const log4js = require('log4js');
const logger = log4js.getLogger();

// Establishing Connection with REDIS Database
const client = redis.createClient(rport);
//const client = redis.createClient(6379, '127.0.0.1');
// const client = redis.createClient(rport, {'return_buffers': true});  
//const client = redis.createClient(7000, '127.0.0.1', {'return_buffers': true}); 

//---------------------------------------INSERTING DATA INTO REDIS DATABASE--------------------------------- 
const insertData = (refinedParsed) => {
    let reference_id = '';
    for (let key in refinedParsed) {
        if (key === 'messageId') {
            reference_id = refinedParsed[key];
            break;
        }
    }
    for (let key in refinedParsed) {
        client.hmset(reference_id, key, refinedParsed[key], (err, data) => {
            if (err) throw err;
            logger.debug("Data Inserted Successfully into REDIS DB", data);
            console.log("Data Inserted Successfully into REDIS DB", data);
            //console.log("Disconnecting from REDIS DB SERVER", client.quit());
        });
    };
    client.hgetall(reference_id, (err, data) => {
        if (err) throw err;
    //console.log("Fetched Data from REDIS DB", data.attachment1_data);
        //console.log("Disconnecting from REDIS DB SERVER", client.quit());
    });
}

module.exports = insertData;