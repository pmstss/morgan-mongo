import * as mongoose from 'mongoose';
import { MappingDescriptor } from './types';

export const userAgentSchemaDef = <mongoose.SchemaDefinition>{
    family: mongoose.Schema.Types.String,
    major: mongoose.Schema.Types.Number,
    minor: mongoose.Schema.Types.Number,
    patch: mongoose.Schema.Types.Number,
    source: mongoose.Schema.Types.String
};

export const defaultMappingDescriptor: MappingDescriptor = {
    date: {
        prop: 'date',
        type: mongoose.Schema.Types.Date,
        params: ['iso']
    },
    'http-version': {
        prop: 'httpVersion'
    },
    method: {
        prop: 'method',
    },
    referrer: {
        prop: 'referrer',
    },
    'remote-addr': {
        prop: 'remoteAddr',
    },
    'remote-user': {
        prop: 'remoteUser',
    },
    'response-time': {
        prop: 'responseTime',
        type: mongoose.Schema.Types.Number,
        params: [2]
    },
    status: {
        prop: 'status',
        type: mongoose.Schema.Types.Number
    },
    url: {
        prop: 'url',
    },
    'user-agent': {
        prop: 'userAgent',
        type: userAgentSchemaDef
    }
};
