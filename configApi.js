// const dotenv = require('dotenv').config();
// const { SALESFORCE_TOKEN_API, SALESFORCE_API, AIML_ENGINE_API } = process.env;
// module.exports = {
//     salesforceTokenApi : SALESFORCE_TOKEN_API,
//     salesforceApi : SALESFORCE_API,
//     aimlEngineApi : AIML_ENGINE_API
// };

module.exports = {
    salesforceTokenApi : "https://login.salesforce.com/services/oauth2/token?grant_type=password&client_id=3MVG9fe4g9fhX0E7A5CImXDuwdklswnpPT5f4joMKG5SBoBkWVNZGifHnlOxwEOQRAdKVXH9vh8u_fpxkSnaQ&client_secret=8457826C9F2BEB934EC03A557F261402FDAB46BC75A87AA1D1E230CCCC4B7BF3&username=integrationjs@dev.com&password=sfdc@1234jZu1AvEj1kSjCicQOwtkLhSvU",
    salesforceApi : "https://veneratesolutions9-dev-ed.my.salesforce.com/services/data/v47.0/composite",
    //aimlEngineApi : "http://172.17.0.2:5000/postdata"
    aimlEngineApi : "http://127.0.0.1:5000/postdata"
};
