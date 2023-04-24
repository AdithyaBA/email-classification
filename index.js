
const { fork } = require('child_process');
//const aimlProcess = fork('./runAiML.js');
setTimeout(() => {
    const supportProcess = fork('./indexSupport.js');
    const invoiceProcess = fork('./indexInvoice.js');
    const cancelProcess = fork('./indexCancel.js');
}, 8000);
