const insertData = require('./redIs');
const sendPython = require('./sendAiMl');

// Create the logger
const log4js = require('log4js');
const logger = log4js.getLogger();

//---------------------------------------REFINNING RAW DATA---------------------------------
function refineData( parsed, username, pwd, host, iport ){
  let refinedParsed = {
    messageId: '',
    date: '',
    subject: '',
    sender: '',
    receiver: '',
    receiverCc: '',
    emailBody: '',
    emailBodyHtml: '',
    incoming: "true",
    status: 'open',
    attachment_count: 0
  };
  let addedInd;
  let addedIndKey;
  let attSuf;
  for(let key in parsed){
    if(key === 'attachments' && parsed[key].length != 0){
      refinedParsed.attachment_count = parsed[key].length;
      for(let attInd in parsed[key]){
        //console.log("wwwwwwwwwww", attInd)
        console.log("eeeeeeeee", parsed[key])
        attSuf = 'attachment';
        addedInd = attInd;
        addedInd++;
        attSuf = attSuf.concat(addedInd, '_');
        for (let attKey in parsed[key][attInd]) {
          if (attKey == 'content') {
              addedIndKey = attSuf;
              addedIndKey = addedIndKey.concat('data');
              refinedParsed[addedIndKey] = parsed[key][attInd][attKey].toString('base64');
          }
          else if (attKey == 'contentType') {
              addedIndKey = attSuf;
              addedIndKey = addedIndKey.concat('mimetype');
              refinedParsed[addedIndKey] = parsed[key][attInd][attKey];
          }
          else if (attKey == 'filename') {
              addedIndKey = attSuf;
              addedIndKey = addedIndKey.concat('name');
              refinedParsed[addedIndKey] = parsed[key][attInd][attKey];
          }
        }
      }
    }
    else if (key == 'text') {
      refinedParsed.emailBody = parsed[key].replace(/(\r\n|\n|\r)/gm, " ");
    } 
    else if (key == 'html') {
      refinedParsed.emailBodyHtml = parsed[key].replace(/(\r\n|\n|\r)/gm, " ");
    }
    else if (key == 'subject') {
      refinedParsed.subject = parsed[key];
      logger.debug("SUBJECT::", refinedParsed.subject);
    } 
    else if (key == 'date') {
      refinedParsed.date = parsed[key];
    } 
    else if (key == 'to') {
      for (let rec in parsed[key]) {
        if (rec == 'text') {
          refinedParsed.receiver = parsed[key][rec];
          logger.debug("TO::", refinedParsed.receiver);
        }
      }
    } 
    else if (key == 'cc') {
      for (let recCc in parsed[key]) {
        if (recCc == 'text') {
          refinedParsed.receiverCc = parsed[key][recCc];
          logger.debug("CC::", refinedParsed.receiverCc);
        }
      }
    }
    else if (key == 'from') {
      for (let sen in parsed[key]) {
        if (sen == 'text') {
            let a = parsed[key][sen].split(" ");
            let b = a[a.length-1];
            refinedParsed.sender = b.slice(1,-1);
            logger.debug("FROM::", refinedParsed.sender);
        }
      }
    } 
    else if (key == 'messageId') {
      logger.debug("MessageId", parsed[key]);
      refinedParsed.messageId = parsed[key];
      //refinedParsed.messageId = parsed[key].slice(1,-1);
    }
  }
  console.log("uuuuuuuuuuuuuuuuuuuuuuuuuu", refinedParsed);
  insertData(refinedParsed);
  sendPython(refinedParsed.messageId, refinedParsed.subject, refinedParsed.emailBody, username, pwd, host, iport);
}

module.exports = refineData;