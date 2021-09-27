-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR,
    "f_name" VARCHAR,
    "l_name" VARCHAR,
    "password_hash" VARCHAR,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" SERIAL NOT NULL,
    "phone_number_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "phone" VARCHAR NOT NULL,
    "verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT NOW(),

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users.user_id_unique" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users.username_unique" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers.phone_number_id_unique" ON "phone_numbers"("phone_number_id");

-- AddForeignKey
ALTER TABLE "emails" ADD FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
