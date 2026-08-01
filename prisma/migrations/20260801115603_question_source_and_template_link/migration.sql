-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('defaults', 'custom');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "questionSource" "QuestionSource" NOT NULL DEFAULT 'defaults';

-- AlterTable
ALTER TABLE "ProductQuestion" ADD COLUMN     "isCustomized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT;

-- CreateIndex
CREATE INDEX "ProductQuestion_templateId_idx" ON "ProductQuestion"("templateId");

-- Existing product questions were copied from the default questions before
-- there was anything linking the two. Every product holds exactly one question
-- of each type, so the type identifies which default it came from — and the
-- HAVING guard makes this a no-op for any type that is not unique.
UPDATE "ProductQuestion" pq
SET "templateId" = t.id
FROM (
  SELECT "questionType", MIN(id) AS id
  FROM "QuestionTemplate"
  GROUP BY "questionType"
  HAVING COUNT(*) = 1
) t
WHERE t."questionType" = pq."questionType" AND pq."templateId" IS NULL;

-- Those copies then drifted: the defaults were edited and the products kept the
-- old wording. Products start out following the defaults, so bring them level.
UPDATE "ProductQuestion" pq
SET "questionText" = qt."questionText",
    "options"      = qt."options",
    "displayOrder" = qt."displayOrder",
    "isCustomized" = false
FROM "QuestionTemplate" qt, "Product" p
WHERE pq."templateId" = qt.id
  AND p.id = pq."productId"
  AND p."questionSource" = 'defaults';
