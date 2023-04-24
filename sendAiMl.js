// Including the Required Modules
const redis = require('redis');
const { rport } = require('./configRedis');
const axios = require('axios').default;
inspect = require('util').inspect;
const daemon = require("./daemon");
const markEmailRead = require('./markReadLabel.js');
const sendEmptyBody = require("./emptyEmailBody");
const { salesforceTokenApi, salesforceApi, aimlEngineApi } = require('./configApi.js');

// Establishing Connection with REDIS Database
const client = redis.createClient(rport);
//const client = redis.createClient(6379, '127.0.0.1');

// Create the logger
const log4js = require('log4js');
const logger = log4js.getLogger();

//---------------------------------------SENDING DATA TO AI/ML ENGINE---------------------------------  
const sendPython = (refinedMessageId, refinedSubject, refinedEmailBody, username, pwd, host, iport) => {
  let reference_id;
  let receiveAiMl;
  let sendAiMlData = {
    referenceId: '',
    subject: '',
    emailBody: '',
    emailType: 'text'
  };
  sendAiMlData.referenceId = refinedMessageId;
  sendAiMlData.subject = refinedSubject;
  sendAiMlData.emailBody = refinedEmailBody;
  sendAiMlData=JSON.stringify(sendAiMlData);

  if(refinedEmailBody.trim() === ""){
    sendEmptyBody(refinedMessageId, refinedSubject, refinedEmailBody, username, pwd, host, iport);
  }
  else{
  axios.post( aimlEngineApi, sendAiMlData , {
    headers: {
        'Content-Type': 'application/json'
    }
  })
  .then(response=> {
    receiveAiMl=response.data;
    logger.debug("RESPONSE FROM AIML", receiveAiMl);
    reference_id=response.data.referenceId;
    searchAtt();
  })
  .catch(error => {
      logger.error("AIML ENGINE NOT ABLE TO PROCESS DATA");
      console.log("AIML ENGINE NOT ABLE TO PROCESS DATA", error);
      //setTimeout(() => { process.exit(0); }, 8000);
      daemon.daemon()
  })
  function searchAtt(){
    client.hgetall(reference_id, (err, data) => {
      if (err) throw err;
      let redisData = data;
      let sendSFdata = {
        "compositeRequest": 
        [
          {
            "method": "POST",
            "url": "/services/data/v47.0/sobjects/Case/",
            "referenceId": "caseRef",
            "body": {
              "Subject": redisData.subject,
              "Description": redisData.emailBody,
              "Sentiment__c": receiveAiMl.Sentiment__c,
              "Category__c": receiveAiMl.Category__c,
              "Sub_Category__c": receiveAiMl.Sub_Category__c,
              "Status": "New",
              "Origin": "Email",
              "Priority": receiveAiMl.Priority,
              "SuppliedEmail": redisData.sender
            }
          },
          {
            "method": "POST",
            "url": "/services/data/v47.0/sobjects/EmailMessage/",
            "referenceId": "EMsgId",
            "body": {
              "ParentId": "@{caseRef.id}",
              "TextBody": redisData.emailBody,
              "HtmlBody": redisData.emailBodyHtml,
              "Incoming": redisData.incoming,
              "CcAddress": redisData.receiverCc,
              "Subject": redisData.subject,
              "FromAddress": redisData.sender,
              "ToAddress": redisData.receiver,
              "EmailReference_Id__c" : redisData.messageId
            }
          },
          {
                  "method": "GET",
                  "url": "/services/data/v47.0/query?q=SELECT+Id,EmailReference_Id__c+FROM+EmailMessage+Where+Id='@{EMsgId.id}'",
                  "referenceId": "EMsgId3"
          }
        ]
      };
      let sendSFatt = {
        "attachment": [
          {
            "method": "POST",
            "url": "/services/data/v47.0/sobjects/ContentVersion/",
            "referenceId": "contentVersionRef",
            "body": {
                "PathOnClient": "",
                "Title": "",
                "VersionData": ""
            }
          },
          {
            "method": "GET",
            "url": "/services/data/v47.0/query?q=SELECT+Id,ContentDocumentId+FROM+ContentVersion+Where+Id='@{contentVersionRef.id}'",
            "referenceId": "getContentVersionRef"
          },
          {
            "method": "POST",
            "url": "/services/data/v47.0/sobjects/ContentDocumentLink",
            "referenceId": "contentDocumentLinkRef",
            "body": {
                "ContentDocumentId": "@{getContentVersionRef.records[0].ContentDocumentId}",
                "LinkedEntityId": "@{caseRef.id}",
                "ShareType": "I"
            }
          }
        ]
      };
      let addedIndR;
      let attSufR;
      for(let i=0; i<redisData.attachment_count; i++){
        attSufR = 'attachment';
        addedIndR = i;
        addedIndR++;
        sendSFatt.attachment[0].body.PathOnClient = redisData[attSufR.concat(addedIndR, '_name')];
        sendSFatt.attachment[0].body.Title = redisData[attSufR.concat(addedIndR, '_name')].split(".")[0];
        sendSFatt.attachment[0].body.VersionData = redisData[attSufR.concat(addedIndR, '_data')];
        if(i == 0){
          for(let j=0; j<3; j++){
              sendSFdata.compositeRequest.push(JSON.parse(JSON.stringify(sendSFatt.attachment[j])));
          }
        }
        else{
          let cVRef = "contentVersionRef";
          let gCVRef = "getContentVersionRef";
          let cDLRef = "contentDocumentLinkRef";
          cVRef = cVRef.concat(i);
          gCVRef = gCVRef.concat(i);
          cDLRef = cDLRef.concat(i);
          let tmp = JSON.parse(JSON.stringify(sendSFatt));
          tmp.attachment[0].referenceId = cVRef;
          tmp.attachment[1].url=tmp.attachment[1].url.replace("contentVersionRef", cVRef);
          tmp.attachment[1].referenceId = gCVRef;
          tmp.attachment[2].referenceId = cDLRef;
          tmp.attachment[2].body.ContentDocumentId=tmp.attachment[2].body.ContentDocumentId.replace("getContentVersionRef", gCVRef);
          for(let j=0; j<tmp.attachment.length; j++){
            sendSFdata.compositeRequest.push(JSON.parse(JSON.stringify(tmp.attachment[j])));
          }
        }
      }
      let sendSalesforceData = JSON.stringify(sendSFdata);
      function callApi(sendSalesforceData){
        async function getToken() {
          try {
            const response = await axios.post(salesforceTokenApi);
            //logger.debug("ACCESS TOKEN FROM SALESFORCE API", response.data.access_token);
            getApi(response.data.access_token);
          } catch (error) {
            logger.error("NOT ABLE TO GET ACCESS TOKEN FROM SALESFORCE API");
            console.error(error);
          }
        }
        async function getApi(access_token) {
          try {
            const response = await axios.post(salesforceApi, sendSalesforceData, {
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `OAuth ${access_token}`
              }
            });
            if(response.data.compositeResponse[0].body.success == true){
              let reference_id = response.data.compositeResponse[2].body.records[0].EmailReference_Id__c;
              logger.debug("RESPONSE STATUS CODE FROM AIML", response.status);
              let processedStatus='Ticket Created Successfully';
              logger.debug(processedStatus);
              markEmailRead(reference_id, processedStatus, username, pwd, host, iport);

              client.del(reference_id, (err, data) => {
                if (err) throw err;
                logger.debug("--------------MESSAGE DELETED FROM REDIS DB----------", data);
                console.log("--------------MESSAGE DELETED FROM REDIS DB----------", data);
              }); 
            }
          } catch (error) {
            logger.error("UNABLE TO CREATE TICKET IN SALESFORCE", error);
            console.error(error);
          }
        }
        getToken();
      }
      callApi(sendSalesforceData);
    });
  }
}
}

module.exports = sendPython;