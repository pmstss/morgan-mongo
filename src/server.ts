import * as express from 'express';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import { morganMongoMiddleware } from './morgan-mongo';

export const app = express();
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 4);

app.use(logger('dev'));

app.use(morganMongoMiddleware(
    {
        connectionString: process.env.MONGO_URI_OMS
    },
    {
        dbName: process.env.MONGO_DB_MORGAN
    },
    {
        capped: {
            size: 1024 * 1024,
            max: 5 * 1024
        },
        collection: 'request-logs'
    }
));

app.use('*', (req, res) => {
    if (mongoose.models.Log) {
        mongoose.models.Log.find({}, null, { limit: 10, sort: { _id: -1 } }, (err, docs) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.header('Content-Type', 'application/json');
                res.send(docs);
            }
        });
    } else {
        res.redirect('/demo');
    }
});

app.listen(app.get('port'));
