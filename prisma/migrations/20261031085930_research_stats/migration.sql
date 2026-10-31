-- CreateTable
CREATE TABLE "ResearchStat" (
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchStat_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ResearchStat_kind_updatedAt_idx" ON "ResearchStat"("kind", "updatedAt");

