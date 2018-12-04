import * as express from 'express';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import { morganMongoMiddleware } from './morgan-mongo';

export const app = express();
app.set('port', process.env.PORT || 3001);
app.set('json spaces', 4);

app.use(logger('dev'));

app.use(morganMongoMiddleware(
    {
        // connectionString: process.env.MONGO_MORGAN_URI
    },
    {
        // dbName: process.env.MONGO_MORGAN_DB
    },
    {
        capped: {
            size: 1024 * 1024,
            max: 5 * 1024
        },
        collection: process.env.MONGO_MORGAN_COLLECTION || 'request-logs'
    }
));

app.use('/results', (req, res) => {
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
        res.redirect('/init');
    }
});

app.use('*', (req, res) => {
    res.header('Content-Type', 'text/html').send('Thank you! Your visit has been recorded. ' +
        '<a href="/results">Have a look at last 10 visits here.</a>');
});

app.listen(app.get('port'));
