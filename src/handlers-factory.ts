import * as mongoose from 'mongoose';
import { Handler } from './types';
import { userAgentSchemaDef } from './default-mapping-descriptor';

const useragent = require('useragent');

export class HandlersFactory {
    static getHandler(type: typeof mongoose.SchemaType | mongoose.SchemaTypeOpts<any>)
            : Handler<any> {
        if (type === mongoose.Schema.Types.Number) {
            return value => +value;
        }

        if (type === mongoose.Schema.Types.Date) {
            return value => new Date(value);
        }

        if (type === userAgentSchemaDef) {
            return (value) => {
                const ua = useragent.parse(value);
                return {
                    ...ua,
                    major: +ua.major,
                    minor: +ua.minor,
                    patch: +ua.patch
                };
            };
        }

        return value => value;
    }
}
