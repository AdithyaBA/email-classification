// Including the Required Modules
const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const { username, pwd, host, conntimeout, authtimeout, iport, susername, iusername } = require('./configCancel');
const priorityEmails = require('./configPriorityEmail');
const { fork } = require('child_process');
const daemon = require("./daemon");
//const outlookProcess = fork('./outlook.js');
const markEmailRead = require('./markReadLabel.js');
const refineData = require('./refine.js');

const log4js = require('log4js');
const log = require("./configLog");
const logger = log4js.getLogger();

// Configuration of Imap with Gmail
const imap = new Imap({
  user: username,                           		// user email
  password: pwd,                            		// user password
  host: host,                 
  port: iport,                              		// Incoming connections to the IMAP server at imap.gmail.com
  tls: true,                                    	// Security protocol that encrypts email to protect its privacy
  connTimeout: conntimeout,                      	// Number of milliseconds to wait for a connection to be established. Default: 10000 
  authTimeout: authtimeout,                      	// Number of milliseconds to wait to be authenticated after a connection has been established. Default: 5000 
  tlsOptions: { rejectUnauthorized: false }
});

// Opening Mail Inbox
function openInbox(cb){
  imap.openBox('INBOX', true, cb);
}

// Event will call once the Imap is successfully made connection with imap host
imap.once('ready', function(){
  logger.debug('STARTED EMAIL READING...');
  console.log("STARTED EMAIL READING...");
  openInbox(function(err, box){
    if (err) throw err;
    // Search for Unread Emails
    imap.search(['UNSEEN'], function(err, results){
      logger.debug("NO. OF UNREAD EMAILS %s", results.length);
      console.log("NO. OF UNREAD EMAILS %s", results.length);
      if(results.length == 0){
        //setTimeout(() => { process.exit(0); }, 8000);
        daemon.daemon()
      }
      else{
      if (err) throw err;
      if (results.length != 0) {
        // Fetching data from Email
        let emailFile = imap.fetch(results, { bodies: '' });
        emailFile.on('message', function(msg, seqno){
          msg.on('body', async function(stream, info){
          //Parsing all fetched data from Email
          let parsed = await simpleParser(stream);
          let processed = false;
          if(processed === false){
            if(parsed.to !== undefined){
              let toArr = parsed.to.text.split(",");
              for(let i=0; i<toArr.length; i++){
                toArr[i] = toArr[i].trim();
              }
              let currentEmail='';
              pEloop:
              for(let priorityEmail in priorityEmails){
                for(let i=0; i<toArr.length; i++){
                  if( priorityEmails[priorityEmail] === toArr[i] ){
                    currentEmail = priorityEmails[priorityEmail];
                    break pEloop;
                  }
                }
              }
              if( currentEmail === username){
                logger.debug('Processed by TO Field ', currentEmail );
                console.log('Processed by TO Field ', currentEmail );
                processed = true;
                refineData(parsed, username, pwd, host, iport );
              }
              else{
                if(currentEmail !== '' ){
                  processed = true;
                  let processedStatus='PROCESSED BY ' + currentEmail;
                  markEmailRead(parsed.messageId, processedStatus, username, pwd, host, iport);
                }
              } 
            }
          }
          if(processed === false){
            if(parsed.cc !== undefined){
              let ccArr = parsed.cc.text.split(",");
              for(let i=0; i<ccArr.length; i++){
                ccArr[i] = ccArr[i].trim();
              }
              let currentEmail='';
              pEloop:
              for(let priorityEmail in priorityEmails){
                for(let i=0; i<ccArr.length; i++){
                  if( priorityEmails[priorityEmail] == ccArr[i] ){
                    currentEmail = priorityEmails[priorityEmail];
                    break pEloop;
                  }
                }
              }
              if( currentEmail === username){
                logger.debug('Processed by CC Field ', currentEmail );
                console.log('Processed by CC Field ', currentEmail );
                refineData(parsed, username, pwd, host, iport );
              }
              else{
                if(currentEmail !== '' ){
                  logger.debug('Processed by ', currentEmail );
                  console.log('Processed by ', currentEmail );
                  let processedStatus='PROCESSED BY ' + currentEmail;
                  markEmailRead(parsed.messageId, processedStatus, username, pwd, host, iport);
                }
              }
            }
          }
          })
          // Event will call once data parsing ends
          msg.once('end', function() {
          logger.debug("Finished Email Reading...");
          console.log("Finished Email Reading...");
          });
        })
        emailFile.once('error', function(err) {
          logger.error('Fetch error: ' + err);
          console.log('Fetch error: ' + err);
          });
        emailFile.once('end', function() {
          logger.debug('DONE FETCHING ALL UNREAD EMAILS!');
          console.log('DONE FETCHING ALL UNREAD EMAILS!');
          //imap.end();
        });
      }
    } 
    })
  })
});

// Event will call if there is any issue will come during making imap connection
imap.once('error', function(err) { 
  //daemon.daemon();
  logger.error('----IMAP CONNECTION TIMEOUT ERROR. PLEASE CHECK INTERNET CONNECTION AND RESTART THIS APPLICATION----', err);
  logger.log('----IMAP CONNECTION TIMEOUT ERROR. PLEASE CHECK INTERNET CONNECTION AND RESTART THIS APPLICATION----', err);
  setTimeout(() => { process.exit(0); }, 1000);
  logger.error("---IMAP CONNECTION ERROR---", err);
  console.log("---IMAP CONNECTION ERROR---", err);
});

// Event will call once the imap connection is closed
imap.once('end', function() {
  logger.debug('Connection ended');
  console.log('Connection ended');
});

// Creating Imap Connection
imap.connect();
