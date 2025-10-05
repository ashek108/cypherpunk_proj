
import { foreignKey, index } from "drizzle-orm/pg-core";
import {pgTable,text,timestamp,uuid} from "drizzle-orm/pg-core"

export const profiles = pgTable("profiles",{
    id:uuid("id").primaryKey().notNull(),
    username:text("username").notNull().unique(),
    createAt:timestamp("created-at").defaultNow().notNull()
});
export const posts = pgTable("posts",{
    id:uuid("id").primaryKey().notNull().defaultRandom(),
    profileid:uuid("profile_id").notNull().references(()=>profiles.id),
    parentid:uuid("parent_id"),
    content:text("content").notNull(),
    createdAt: timestamp("created-at").defaultNow().notNull(),
},((table)=>{
    return{
        parentReference:foreignKey({
            columns:[table.parentid],
            foreignColumns:[table.id],
            name:"post_parent_id_fkey",
        }),
        createdAtIdx:index("posts_created_at_idx").on(table.createdAt),
        profileIdIdx:index("posts_profile_id_idx").on(table.profileid),
        parentIdIdx: index("posts_parent_id_idx").on(table.parentid)

    }
}));