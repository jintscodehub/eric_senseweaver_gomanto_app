-- Enable ltree extension for hierarchical paths
CREATE EXTENSION IF NOT EXISTS ltree;

-- Nodes table tsvector column and trigger for simple full-text search
ALTER TABLE IF EXISTS "Node"
ADD COLUMN IF NOT EXISTS "tsv" tsvector;

CREATE OR REPLACE FUNCTION nodes_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('simple', coalesce(NEW.title,'') || ' ' || coalesce(NEW.metadata::text,''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nodes_tsv_update_trigger ON "Node";
CREATE TRIGGER nodes_tsv_update_trigger BEFORE INSERT OR UPDATE ON "Node"
FOR EACH ROW EXECUTE FUNCTION nodes_tsv_update();

-- Paths path column as ltree (Prisma represents as text)
ALTER TABLE IF EXISTS "Path"
  ALTER COLUMN "path" TYPE ltree USING "path"::ltree;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_tsv ON "Node" USING GIN (tsv);
CREATE INDEX IF NOT EXISTS idx_paths_path ON "Path" USING GIST (path);
