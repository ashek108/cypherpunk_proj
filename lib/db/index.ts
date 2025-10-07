import {drizzle} from "drizzle-orm/postgres-js"
import * as schema from './schema'
import postgres from 'postgres'



let connection:postgres.Sql;

if(process.env.NODE_ENV === 'production'){
    connection = postgres(process.env.DATABASE_URL!)
}else{
    const globalConnection = global as typeof globalThis &{
        connection: postgres.Sql
    }
    if(!globalConnection.connection){
        globalConnection.connection = postgres(process.env.DATABASE_URL!,{
            prepare:false
        })
    }
    connection = globalConnection.connection;
}

const db = drizzle(connection,{
    schema 
});

export * from "./schema"
export {db};