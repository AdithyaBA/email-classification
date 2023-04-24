const log4js = require('log4js');
const log4js_extend = require("log4js-extend");

// App settings
const { traceLogConfig } = require('./conf/log-settings').log4js;

// Logger configuration
log4js_extend(log4js.configure(traceLogConfig),{
    format: "-- @line :: @file"
});