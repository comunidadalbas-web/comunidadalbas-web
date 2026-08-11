-- Additive migration only. Do not apply to production without explicit authorization.
CREATE TYPE "BlogCommentStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

ALTER TABLE "BlogPost"
  ADD COLUMN "commentsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- The publication was verified as unique and published before preparing this migration.
UPDATE "BlogPost"
SET "commentsEnabled" = true
WHERE "slug" = 'cuota-servicios-y-transparencia-queremos-conocer-tu-opinion';

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "parentId" TEXT,
  "displayName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "BlogCommentStatus" NOT NULL DEFAULT 'PENDING',
  "isInstitutional" BOOLEAN NOT NULL DEFAULT false,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
CREATE INDEX "BlogComment_postId_status_parentId_createdAt_idx" ON "BlogComment"("postId", "status", "parentId", "createdAt");
CREATE INDEX "BlogComment_parentId_status_createdAt_idx" ON "BlogComment"("parentId", "status", "createdAt");

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
