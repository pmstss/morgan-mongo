import * as express from 'express';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import { MappingDescriptor, OptionsType } from './types';
import { defaultMappingDescriptor } from './default-mapping-descriptor';
import { HandlersFactory } from './handlers-factory';

export class MorganMongo {
    private options: OptionsType;
    private connectionOptions: mongoose.ConnectionOptions;
    private schemaOptions: mongoose.SchemaOptions;

    private connectionPromise: Promise<mongoose.Mongoose>;

    private mappingDescriptor: MappingDescriptor;
    private schemaDefinition: mongoose.SchemaDefinition;
    private schema: mongoose.Schema;
    private model: mongoose.Model<any>;

    constructor(options: OptionsType,
                connectionOptions: mongoose.ConnectionOptions,
                schemaOptions: mongoose.SchemaOptions) {
        this.options = Object.assign(
            {
                connectionString: 'mongodb://localhost:27017/morgan-mongo'
            },
            options
        );
        this.connectionOptions = Object.assign(
            {
                useNewUrlParser: true
            },
            connectionOptions
        );
        this.schemaOptions = Object.assign(
            {
                versionKey: false,
                strict: true,
                writeConcern: {
                    w: 0
                }
            },
            schemaOptions
        );
    }

    getConnectionPromise() {
        if (!this.connectionPromise) {
            this.connectionPromise = mongoose.connect(
                this.options.connectionString,
                this.connectionOptions
            );
        }

        return this.connectionPromise;
    }

    private static generateSchemaDefinition(mappingDescriptor: MappingDescriptor)
            : mongoose.SchemaDefinition {
        return Object.keys(mappingDescriptor).reduce(
            (res: mongoose.SchemaDefinition, token: string): mongoose.SchemaDefinition => {
                res[mappingDescriptor[token].prop] = mappingDescriptor[token].type ||
                    mongoose.Schema.Types.String;
                return res;
            },
            <mongoose.SchemaDefinition>{}
        );
    }

    private getMappingDescriptor(): MappingDescriptor {
        if (!this.mappingDescriptor && this.options.customMapping) {
            this.mappingDescriptor = this.options.customMapping;
        } else if (!this.mappingDescriptor) {
            let tokens: string[] = Object.keys(defaultMappingDescriptor);
            if (this.options.includeOnly) {
                tokens = tokens.filter(token => this.options.includeOnly.includes(token));
            } else if (this.options.exclude) {
                tokens = tokens.filter(token => !this.options.exclude.includes(token));
            }

            const descriptor = tokens.reduce(
                (res: MappingDescriptor, token: string): MappingDescriptor => {
                    res[token] = defaultMappingDescriptor[token];
                    return res;
                },
                {}
            );

            this.mappingDescriptor = Object.assign(descriptor, this.options.augment || {});
        }

        return this.mappingDescriptor;
    }

    private getSchemaDefinition(): mongoose.SchemaDefinition {
        if (!this.schemaDefinition) {
            this.schemaDefinition = MorganMongo.generateSchemaDefinition(
                this.getMappingDescriptor());
        }

        return this.schemaDefinition;
    }

    getSchema(): mongoose.Schema {
        if (!this.schema) {
            const def = this.getSchemaDefinition();
            this.schema = new mongoose.Schema(def, this.schemaOptions);
        }
        return this.schema;
    }

    getModel(): mongoose.Model<any> {
        if (!this.model) {
            this.model = mongoose.model('Log', this.getSchema());
        }
        return this.model;
    }

    private static parseToken(token: string): {name: string, params: any[]} {
        const parts = token.split(':');
        return {
            name: parts[0],
            params: parts.length === 1 ? [] : parts.slice(1)
        };
    }

    prepareLogEntry(tokens: morgan.TokenIndexer,
                    req: express.Request, res: express.Response): mongoose.Document {
        const LogEntryModel = this.getModel(); // tslint:disable-line:variable-name
        const logEntry: mongoose.Document = new LogEntryModel();

        const mappingDescriptor = this.getMappingDescriptor();
        Object.keys(mappingDescriptor).forEach((token) => {
            const tokenMeta = MorganMongo.parseToken(token);
            const mappingMeta = mappingDescriptor[token];

            const params = mappingMeta.params || tokenMeta.params;
            const value = tokens[tokenMeta.name](req, res, ...params);
            const handler = mappingMeta.handler || HandlersFactory.getHandler(mappingMeta.type);

            logEntry.set(mappingMeta.prop, handler(value));
        });

        return logEntry;
    }

    persistLogEntry(logEntry: mongoose.Document): Promise<mongoose.Document> {
        return this.getConnectionPromise().then(() => {
            return logEntry.save((err: any) => {
                if (err) {
                    console.error(err);
                }
            });
        });
    }
}

/* tslint:disable:max-line-length */
/**
 * MongooseMorgan object
 * @param  {object} options - represents mongo database data, requires { connectionString : '{MONGO_URL}' } parameter.
 * @param  {object} connectionOptions - mongoose ConnectionOptions ({@link https://mongoosejs.com/docs/api.html#mongoose_Mongoose-connect})
 * @param  {object} schemaOptions  - mongoose SchemaOptions ({@link https://mongoosejs.com/docs/api.html#schema_Schema})
 * @param  {object} morganOptions  - morgan Options ({@link https://github.com/expressjs/morgan#options})
 */
/* tslint:enable:max-line-length */
export function morganMongoMiddleware(
    options: OptionsType = {},
    connectionOptions: mongoose.ConnectionOptions = {},
    schemaOptions: mongoose.SchemaOptions = {},
    morganOptions: morgan.Options = {}
) {
    const morganMongo = new MorganMongo(options, connectionOptions, schemaOptions);
    return morgan(
        (tokens: morgan.TokenIndexer, req: express.Request, res: express.Response) => {
            try {
                const logEntry = morganMongo.prepareLogEntry(tokens, req, res);
                morganMongo.persistLogEntry(logEntry);
            } catch (e) {
                console.log(e);
            }

            return '';
        },
        morganOptions
    );
}
