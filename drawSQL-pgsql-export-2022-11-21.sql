CREATE TABLE "UserInfo"(
    "user_id" INTEGER NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "user_password" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "UserInfo" ADD PRIMARY KEY("user_id");
ALTER TABLE
    "UserInfo" ADD CONSTRAINT "userinfo_user_email_unique" UNIQUE("user_email");
CREATE TABLE "PostInfo"(
    "post_id" INTEGER NOT NULL,
    "post_title" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "post_description" TEXT NOT NULL
);
ALTER TABLE
    "PostInfo" ADD PRIMARY KEY("post_id");
CREATE TABLE "ImageInfo"(
    "image_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,
    "image_reference" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "ImageInfo" ADD PRIMARY KEY("image_id");
ALTER TABLE
    "ImageInfo" ADD CONSTRAINT "imageinfo_post_id_foreign" FOREIGN KEY("post_id") REFERENCES "PostInfo"("post_id");
ALTER TABLE
    "PostInfo" ADD CONSTRAINT "postinfo_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "UserInfo"("user_id");