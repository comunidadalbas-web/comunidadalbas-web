-- Enrich the public document catalogue with lifecycle and storage metadata.
ALTER TABLE "Document"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "documentDate" TIMESTAMP(3),
  ADD COLUMN "fileSizeBytes" INTEGER,
  ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'EXTERNAL',
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "isPermanent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Document_visibility_approvedAt_category_documentDate_idx"
  ON "Document"("visibility", "approvedAt", "category", "documentDate");
