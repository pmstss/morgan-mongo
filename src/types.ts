import * as mongoose from 'mongoose';

export type Handler<T> = (value: string) => T;

export type MappingDescriptor = { [tokenName: string]: MappingMeta<any> };

export type MappingMeta<T> = {
    prop: string,
    type?: typeof mongoose.SchemaType | mongoose.SchemaDefinition,
    params?: any[],
    handler?: Handler<T>
};

export type OptionsType = {
    connectionString?: string;
    includeOnly?: string[];
    exclude?: string[];
    augment?: MappingDescriptor;
    customMapping?: MappingDescriptor;
};
