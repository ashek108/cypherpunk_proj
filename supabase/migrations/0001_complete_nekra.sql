ALTER TABLE "hashtags" DROP CONSTRAINT "hashtags_name_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "post_hashtags" DROP CONSTRAINT "post_hashtags_id_posts_id_fk";
--> statement-breakpoint
DROP INDEX "post_hashtag_post_id_idx";--> statement-breakpoint
ALTER TABLE "post_hashtags" DROP CONSTRAINT "post_hashtags_id_hashtag_id_pk";--> statement-breakpoint
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_post_id_hashtag_id_pk" PRIMARY KEY("post_id","hashtag_id");--> statement-breakpoint
ALTER TABLE "post_hashtags" ADD COLUMN "post_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_hashtag_post_id_idx" ON "post_hashtags" USING btree ("post_id");--> statement-breakpoint
ALTER TABLE "post_hashtags" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "hashtags" ADD CONSTRAINT "hashtags_name_unique" UNIQUE("name");