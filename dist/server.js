"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const morgan_mongo_1 = require("./morgan-mongo");
exports.app = express();
exports.app.set('port', process.env.PORT || 3000);
exports.app.set('json spaces', 4);
exports.app.use(logger('dev'));
exports.app.use(morgan_mongo_1.morganMongoMiddleware({
    connectionString: process.env.MONGO_URI_OMS
}, {
    dbName: process.env.MONGO_DB_MORGAN
}, {
    capped: {
        size: 1024 * 1024,
        max: 5 * 1024
    },
    collection: 'request-logs'
}));
exports.app.use('*', (req, res) => {
    if (mongoose.models.Log) {
        mongoose.models.Log.find({}, null, { limit: 10, sort: { _id: -1 } }, (err, docs) => {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.header('Content-Type', 'application/json');
                res.send(docs);
            }
        });
    }
    else {
        res.redirect('/demo');
    }
});
exports.app.listen(exports.app.get('port'));
