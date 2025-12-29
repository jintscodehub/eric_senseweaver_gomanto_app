ALTER TABLE "Edge"
ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

UPDATE "Edge" e
SET slug = n.slug
FROM "Node" n
WHERE e."childId" = n.id;

ALTER TABLE "Node" DROP COLUMN "slug";
ALTER TABLE "Edge"
DROP CONSTRAINT IF EXISTS "Edge_parentId_childId_label_key";

CREATE UNIQUE INDEX "edge_parent_slug_unique"
ON "Edge" ("parentId", "slug");

TRUNCATE TABLE "Path";
