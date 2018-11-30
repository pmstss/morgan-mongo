# morgan-mongo

Node.js HTTP request logger middleware for [Express](https://github.com/expressjs/express) 
with [MongoDB](https://www.mongodb.com) as storage; [morgan](https://github.com/expressjs/morgan) and [Mongoose](https://github.com/Automattic/mongoose) based.

Inspired by [Storing Log Data](https://docs.mongodb.com/ecosystem/use-cases/storing-log-data) MongoDB article.

Built-in support for string, numeric, date and user agent tokens parsing.

Highly configurable output with meaningful defaults; support for standart mongoose and morgan options.  

### Installation
    npm install morgan-mongo --save

### Usage

```TypeScript
import { morganMongoMiddleware } from 'morgan-mongo';
const app = express();
...
app.use(morganMongoMiddleware());
```

### Output sample
```js
{
    "_id" : ObjectId("5c012d5375bad213309ad4c3"),
    "userAgent" : {
        "family" : "Chrome",
        "major" : 70,
        "minor" : 0,
        "patch" : 3538,
        "source" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36"
    },
    "date" : ISODate("2018-11-30T12:30:11.814Z"),
    "httpVersion" : "1.1",
    "method" : "GET",
    "remoteAddr" : "::1",
    "responseTime" : 92.56,
    "status" : 200,
    "url" : "/quotes?date=2018-11-28"
}
```

### API

    morganMongoMiddleware(options?, connectionOptions?, schemaOptions?, morganOptions?)

#### options
Custom options to provide MongoDB connection string and to control entries parsing.
```TypeScript
export type OptionsType = {
    connectionString?: string;
    includeOnly?: string[];
    exclude?: string[];
    augment?: MappingDescriptor;
    customMapping?: MappingDescriptor;
};
```
Please have a look in [tests](test/morgan-mongo.spec.ts) for now for usage samples.

#### connectionOptions
mongoose [ConnectionOptions](https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect)

#### schemaOptions
mongoose [SchemaOptions](https://mongoosejs.com/docs/api.html#schema_Schema)

#### morganOptions
morgan [Options](https://github.com/expressjs/morgan#options)

### Contribution
Feel free to contribute by opening issues with any questions, bug reports and feature requests.

### Credits
[mongoose-morgan](https://github.com/nemanjapetrovic/mongoose-morgan) - entries are not parsed but stored in mongo as strings.

### License
  [MIT](LICENSE)
