/*
  Warnings:

  - You are about to drop the column `cityVillage` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `residenceType` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "residenceType" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("age", "createdAt", "district", "fullName", "gender", "id", "mobileNumber", "profession", "sessionToken", "updatedAt") SELECT "age", "createdAt", "district", "fullName", "gender", "id", "mobileNumber", "profession", "sessionToken", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_sessionToken_key" ON "Customer"("sessionToken");
CREATE INDEX "Customer_mobileNumber_idx" ON "Customer"("mobileNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
