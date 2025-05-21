/*
  Warnings:

  - You are about to drop the `Member` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_upline_id_fkey";

-- DropTable
DROP TABLE "Member";

-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "upline_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_phone_key" ON "member"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "member_email_key" ON "member"("email");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_upline_id_fkey" FOREIGN KEY ("upline_id") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
