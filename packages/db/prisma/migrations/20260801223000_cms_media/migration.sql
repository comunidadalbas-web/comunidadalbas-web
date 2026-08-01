-- Optional media metadata for campaign and blog presentation.
-- Nullable columns preserve all existing records and public behavior.
ALTER TABLE "Campaign"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "imageAlt" TEXT;

ALTER TABLE "BlogPost"
  ADD COLUMN "coverImageAlt" TEXT;
