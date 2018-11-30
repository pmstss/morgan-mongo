import * as sinon from 'sinon';
import * as mongoose from 'mongoose';
import * as chai from 'chai';
import { AnyObject, TOKENS, TestUtils, expectedValues } from './test-utils';
import { MorganMongo } from '../src/morgan-mongo';

const expect = chai.expect;

const postpone = (f: () => void) => setTimeout(f, 100);

describe('Tests for morgan-mongo', () => {
    beforeEach(() => {
        // @ts-ignore
        mongoose['models'] = {};
        // noop
    });

    afterEach(() => {
        // noop
    });

    it('log entry save() is called on request', (done) => {
        const saveSpy = sinon.spy();
        const prepareStub = sinon.stub(MorganMongo.prototype, 'prepareLogEntry')
            .returns(<mongoose.Document><any>{
                save: saveSpy
            });
        const connectionStub = sinon.stub(MorganMongo.prototype, 'getConnectionPromise')
            .resolves(true);

        TestUtils.emulateMiddlewareRequest();

        postpone(() => {
            expect(connectionStub.calledOnce).equals(true);
            connectionStub.restore();

            expect(prepareStub.calledOnce).equals(true);
            prepareStub.restore();

            expect(saveSpy.calledOnce).equals(true);
            done();
        });
    });

    it('"connectionOptions" are passed correctly to mongoose', (done) => {
        const connectStub = sinon.stub(mongoose, 'connect').resolves(true);
        const prepareStub = sinon.stub(MorganMongo.prototype, 'prepareLogEntry')
            .returns(<mongoose.Document><any>{
                save: () => {}
            });

        TestUtils.emulateMiddlewareRequest({}, { config: { autoIndex: true } }, {}, {});

        postpone(() => {
            expect(connectStub.calledOnceWith('mongodb://localhost:27017/morgan-mongo', {
                useNewUrlParser: true, // default parameter
                config: {
                    autoIndex: true
                }
            })).equals(true);
            connectStub.restore();

            expect(prepareStub.calledOnce).equals(true);
            prepareStub.restore();
            done();
        });
    });

    it('"schemaOptions" are passed correctly to mongoose', (done) => {
        const connectStub = sinon.stub(mongoose, 'connect').resolves(true);
        const schemaSpy = sinon.spy(mongoose, 'Schema');
        const persistStub = sinon.stub(MorganMongo.prototype, 'persistLogEntry').resolves(null);

        const schemaOptions = {
            strict: false,
            writeConcern: {
                w: 1
            },
            capped: true
        };
        TestUtils.emulateMiddlewareRequest({}, {}, schemaOptions, {});

        postpone(() => {
            const schemaSpyOptions = schemaSpy.args[0][1];
            expect(schemaSpyOptions.capped).equals(true);
            expect(schemaSpyOptions.strict).equals(false);
            expect(schemaSpyOptions.writeConcern.w).equals(1);
            schemaSpy.restore();

            persistStub.restore();
            connectStub.restore();
            done();
        });
    });

    it('custom request/response headers are accessible', (done) => {
        const persistStub = TestUtils.persistStub((entry: AnyObject) => {
            expect(Object.keys(entry)).eql(['_id', 'customRequestHeader', 'customResponseHeader']);
            expect(entry.customRequestHeader).equals(expectedValues[TOKENS.X_CUSTOM_REQ]);
            expect(entry.customResponseHeader).equals(expectedValues[TOKENS.X_CUSTOM_RES]);
        });

        TestUtils.emulateMiddlewareRequest({
            customMapping: {
                [`req:${TOKENS.X_CUSTOM_REQ}`]: {
                    prop: 'customRequestHeader'
                },
                [`res:${TOKENS.X_CUSTOM_RES}`]: {
                    prop: 'customResponseHeader'
                }
            }
        });

        postpone(() => {
            expect(persistStub.calledOnce).equals(true);
            persistStub.restore();
            done();
        });
    });

    it('"includeOnly" parameter filters output properties', (done) => {
        const persistStub = TestUtils.persistStub((entry: AnyObject) => {
            expect(Object.keys(entry).sort()).eql(['_id', 'referrer']);
            expect(entry.referrer).equals(expectedValues[TOKENS.REFERRER]);
        });

        TestUtils.emulateMiddlewareRequest({
            includeOnly: [TOKENS.REFERRER]
        });

        postpone(() => {
            expect(persistStub.calledOnce).equals(true);
            persistStub.restore();
            done();
        });
    });

    it('"exclude" parameter filters output properties', (done) => {
        const persistStub = TestUtils.persistStub((entry: AnyObject) => {
            expect(Object.keys(entry).sort()).eql(['_id', 'status']);
            expect(entry.status).equals(+expectedValues[TOKENS.STATUS]);
        });

        TestUtils.emulateMiddlewareRequest({
            exclude: TestUtils.excludeAllExcept(TOKENS.STATUS)
        });

        postpone(() => {
            expect(persistStub.calledOnce).equals(true);
            persistStub.restore();
            done();
        });
    });

    it('"augment" parameter overrides property name, handler and parameters', (done) => {
        const persistStub = TestUtils.persistStub((entry: AnyObject) => {
            expect(Object.keys(entry)).eql(['_id', 'date', 'ref', 'status']);
            expect(entry.date.includes('/')).equals(true);
            expect(entry.status).equals(`str${expectedValues[TOKENS.STATUS]}`);
            expect(entry.ref).equals(expectedValues[TOKENS.REFERRER]);
        });

        TestUtils.emulateMiddlewareRequest({
            includeOnly: [TOKENS.DATE, TOKENS.STATUS, TOKENS.REFERRER],
            augment: {
                date: {
                    prop: 'date',
                    params: ['clf'],
                    handler: value => `${value}`
                },
                status: {
                    prop: 'status',
                    handler: value => `str${value}`
                },
                referrer: {
                    prop: 'ref'
                }
            }
        });

        postpone(() => {
            expect(persistStub.calledOnce).equals(true);
            persistStub.restore();
            done();
        });
    });

    it('"augment" parameter can introduce new properties', (done) => {
        const persistStub = TestUtils.persistStub((entry: AnyObject) => {
            expect(Object.keys(entry)).eql(['_id', 'customRequestHeader']);
            expect(entry.customRequestHeader).equals(expectedValues[TOKENS.X_CUSTOM_REQ]);
        });

        TestUtils.emulateMiddlewareRequest({
            includeOnly: [],
            augment: {
                [`req:${TOKENS.X_CUSTOM_REQ}`]: {
                    prop: 'customRequestHeader'
                }
            }
        });

        postpone(() => {
            expect(persistStub.calledOnce).equals(true);
            persistStub.restore();
            done();
        });
    });
});
