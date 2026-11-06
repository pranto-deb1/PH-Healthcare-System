/*
  Warnings:

  - You are about to drop the column `googlId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_googlId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "googlId",
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
