/**
 * appSettings
 */
const appSettings = {
    log4js: {
        traceLogConfig: {
            appenders: {
                everything: { type: 'dateFile', filename: './logs/email-classification.log', backups: 10},
                consoleAppender: { type: 'console' }
            },
            categories: {
                default: { appenders: ['everything', 'consoleAppender'], level: 'trace'}
            }
        }
    }
};

module.exports = appSettings;

// log4js.configure({
//     appenders: {
//         everything: { 
//             type: 'file', 
//             filename: 'all-the-logs.log', 
//             maxLogSize: 10485760, 
//             backups: 3, 
//             compress: true 
//         }
//     },
//     categories: {
//         default: { appenders: [ 'everything' ], level: 'debug'}
//     }
// });

