let Imap = require('imap'),
inspect = require('util').inspect;
const daemon = require("./daemon");
// Create the logger
const log4js = require('log4js');
const logger = log4js.getLogger();
//-------------------------code to mark email as READ------------------------------------
function markEmailRead(msgId, processedStatus, username, pwd, host, iport){
  
    let imap = new Imap({
      user: username,                           		// user email
      password: pwd,                            		// user password
      host: host,
      port: iport,                              		// Incoming connections to the IMAP server at imap.gmail.com
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    })
  
  
      
      function openInbox(cb) {
      // openReadOnly = false
      imap.openBox('Inbox', false, cb);
      }
      
      imap.once('ready', function () {
      openInbox(function (err, box) {
      if (err) throw err;
      
      // Search emails having "Some Subject" in their Subject headers
      imap.search([['HEADER','Message-ID', msgId]], function (err, results) {
          if (err) throw err;
      
          try {
              let emailFile = imap.fetch(results, {bodies: 'TEXT'});
              // Mark the above mails as read
              imap.setFlags(results, ['\\Seen'], function(err) {
                  if (!err) {
                    //------------------------------------------SETTING LABEL-------------------------
                    imap.getBoxes(function (err, folders) {
                      if (err) {
                        logger.error('Error', err);
                        console.log('Error', err);
                      }
                      else {
                        for (let fName in folders) {
                          //if(fName == 'Ticket Created Successfully'){
                          if(fName == processedStatus){
                            imap.copy(results, fName, function(err) {
                              if (!err) {
                                logger.debug("EMAIL LABELLING DONE");
                                console.log("EMAIL LABELLING DONE");
                              }
                              else {
                                logger.error('Error', err);
                                console.log('Error', err);
                              }
                            });
                          }
                        }
                      }
                    });
                    logger.debug("EMAIL MARKED AS READ");
                    console.log("EMAIL MARKED AS READ");
                    //setTimeout(() => { process.exit(0); }, 4000)
                    //setTimeout(() => { process.exit(0); }, 4000);
                    daemon.daemon();
                  }
                  else {
                    console.log(JSON.stringify(err, null, 2));
                  }
              });
              emailFile.once('end', function () {
                  //imap.end();
              });
          } catch (errorWhileFetching) {
              console.log(errorWhileFetching.message);
              //imap.end();
          }
      
      });
      });
      });
      
    imap.connect();
  
  }

module.exports = markEmailRead;