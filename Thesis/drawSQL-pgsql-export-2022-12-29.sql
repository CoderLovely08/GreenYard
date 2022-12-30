CREATE TABLE "PostInfo"(
    "post_id" INTEGER NOT NULL,
    "post_title" VARCHAR(255) NOT NULL,
    "post_author_id" INTEGER NOT NULL,
    "post_description" TEXT NOT NULL,
    "post_image_reference" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "PostInfo" ADD PRIMARY KEY("post_id");
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
CREATE TABLE "AdminInfo"(
    "admin_id" INTEGER NOT NULL,
    "admin_name" VARCHAR(255) NOT NULL,
    "admin_username" VARCHAR(255) NOT NULL,
    "admin_password" VARCHAR(255) NOT NULL
);
ALTER TABLE
    "AdminInfo" ADD PRIMARY KEY("admin_id");
ALTER TABLE
    "PostInfo" ADD CONSTRAINT "postinfo_post_author_id_foreign" FOREIGN KEY("post_author_id") REFERENCES "UserInfo"("user_id");