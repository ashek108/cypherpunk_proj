import { relations } from "drizzle-orm";
import { foreignKey, index,primaryKey } from "drizzle-orm/pg-core";
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


export const likes = pgTable("likes",{
    id:uuid("id").defaultRandom().primaryKey().notNull(),
    profileId:uuid("profile_id").notNull().references(()=> profiles.id),
    postId:uuid("post_id").notNull().references(()=>posts.id),
    createAt:timestamp("created_at").defaultNow().notNull()
},(table)=>{
    return {
        profileIdIdx :index("likes_profile_id_idx").on(table.profileId),
        postIdIdx :index("likes_post_id_idx").on(table.postId)
    }
})


export const follows = pgTable("follows",{
    followerId: uuid("follower_id")
    .notNull()
    .references(()=>profiles.id),
    followedId :uuid("followed_id").notNull().references(()=>profiles.id),
    createAt: timestamp("created_at").defaultNow().notNull()
},(table)=>{
    return {
        pk:primaryKey({columns:[table.followerId,table.followedId]}),
        followerIdIdx:index("follows_follower_id_idx").on(table.followerId),
        followedIdIdx:index("follows_followed_id_idx").on(table.followedId)
    };
})

export const hashtags = pgTable("hashtags",{
    id:uuid("id").defaultRandom().primaryKey().notNull(),
    name:text("name").notNull().references(()=>posts.id),
    createAt:timestamp("created_at").defaultNow().notNull()

})

export const  postHashtags = pgTable("post_hashtags",{
    postId:uuid("id").notNull().references(()=>posts.id),
    hashtagId: uuid("hashtag_id").notNull().references(()=>hashtags.id),
    createAt:timestamp("created_at").defaultNow().notNull()
},
(table)=>{
    return{
        pk:primaryKey({columns:[table.postId,table.hashtagId]}),
        postIdIdx:index("post_hashtag_post_id_idx").on(table.postId),
        hashtagIdIdx:index("posts_hashtags_hashtag_id_idx").on(table.hashtagId)
    };
})


export const postsRelations = relations(posts,({one,many})=>({
    profile:one(profiles,{
        fields:[posts.profileid],
        references:[profiles.id],
    }),
    parent:one(posts,{
        fields:[posts.parentid],
        references:[posts.id],
    }),
    children: many(posts),
    likes:many(likes),
    hashtags:many(hashtags),
}));

export const likesRelation = relations(likes,({one})=>({
    profiles: one(profiles,{
        fields:[likes.profileId],
        references:[profiles.id] 
    }),
    posts: one(posts,{
        fields:[likes.postId],
        references:[posts.id]
    })
}))

export const followsRelations = relations(follows,({one})=>({
    follower:one(profiles,{
        fields:[follows.followerId],
        references:[profiles.id],
        relationName:"following"
    }),
    post: one(posts,{
        fields:[follows.followedId],
        references:[posts.id],
        relationName:"followedBy"
    })

}))

export const hashtagsRelations = relations(hashtags,({many})=>({
    posts:many(postHashtags)
}))

export const postHashtagsRelations = relations(postHashtags,({one})=>({
    posts:one(posts,{
        fields:[postHashtags.postId],
        references:[posts.id]
    }),
    hashtag: one(hashtags,{
        fields:[postHashtags.hashtagId],
        references:[hashtags.id]
    })
}))