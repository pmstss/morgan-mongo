import * as sinon from 'sinon';
import * as mongoose from 'mongoose';
import * as express from 'express';
import { Options } from 'morgan';
import { defaultMappingDescriptor } from '../src/default-mapping-descriptor';
import { morganMongoMiddleware } from '../src';
import { OptionsType } from '../src/types';
import { MorganMongo } from '../src/morgan-mongo';

export type AnyObject = {
    [key: string]: any
};

export const TOKENS = {
    DATE: 'date',
    REFERRER: 'referrer',
    X_CUSTOM_REQ: 'x-custom-req',
    X_CUSTOM_RES: 'x-custom-res',
    X_CUSTOM_RES_NUM: 'x-custom-res-num',
    STATUS: 'status'
};

export const expectedValues = {
    [TOKENS.REFERRER]: 'https://github.com',
    [TOKENS.X_CUSTOM_REQ]: 'dummy',
    [TOKENS.X_CUSTOM_RES]: 'dummy',
    [TOKENS.X_CUSTOM_RES_NUM]: 42,
    [TOKENS.STATUS]: '101'
};

const getRequest = () => ({
    headers: {
        [TOKENS.REFERRER]: expectedValues[TOKENS.REFERRER],
        [TOKENS.X_CUSTOM_REQ]: expectedValues[TOKENS.X_CUSTOM_REQ]
    }
});

const getResponse = () => ({
    headersSent: true,
    statusCode: expectedValues[TOKENS.STATUS],
    getHeader: (header: string): any => {
        // @ts-ignore
        return expectedValues[header];
    }
});

export class TestUtils {
    static excludeAllExcept(...tokens: string[]): string[] {
        return Object.keys(defaultMappingDescriptor).filter(token => !tokens.includes(token));
    }

    static emulateMiddlewareRequest(
        options: OptionsType = {},
        connectionOptions: mongoose.ConnectionOptions = {},
        schemaOptions: mongoose.SchemaOptions = {},
        morganOptions: Options = {}
    ) {
        const morgan = morganMongoMiddleware(
            options, connectionOptions, schemaOptions, morganOptions);
        morgan(<express.Request><any>getRequest(), <express.Response><any>getResponse(), () => {});
    }

    static persistStub(callback: (obj: AnyObject) => void) {
        return sinon.stub(MorganMongo.prototype, 'persistLogEntry').callsFake((logEntry) => {
            callback(logEntry.toJSON());
            return new Promise(r => r());
        });
    }
}
