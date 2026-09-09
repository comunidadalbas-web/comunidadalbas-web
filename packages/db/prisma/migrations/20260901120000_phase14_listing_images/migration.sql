-- Migration: Add ListingImage table for Phase 14
-- Accounts for: ListingImage model, relations, indexes, constraints

-- Create ListingImage table
CREATE TABLE "ListingImage" (
  id String NOT NULL,
  listingId String NOT NULL,
  storageKey String NOT NULL,
  altText String?,
  sortOrder Int NOT NULL DEFAULT 0,
  isCover Boolean NOT NULL DEFAULT false,
  createdAt DateTime NOT NULL DEFAULT NOW(),
  updatedAt DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedAt DateTime?,
  CONSTRAINT "ListingImage_pkey" PRIMARY KEY (id)
);

-- Foreign key relationship: Listing 1:N ListingImage
ALTER TABLE "ListingImage"
  ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY (listingId) REFERENCES "Listing"(id) ON DELETE CASCADE;

-- Index for querying by listing
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage" (listingId);

-- Unique constraint: one cover per listing
CREATE UNIQUE INDEX "ListingImage_listingId_isCover_unique" ON "ListingImage" (listingId, isCover) WHERE isCover = true;

-- Comment
COMMENT ON TABLE "ListingImage" IS 'Images associated with a listing. Soft delete supported.';