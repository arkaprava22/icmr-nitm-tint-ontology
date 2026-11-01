-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PUBLIC_USER', 'PRACTITIONER', 'REVIEWER', 'SENIOR_REVIEWER', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'CHANGES_REQUESTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AUTOMATED_CHECKS', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'SUPERSEDED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "ContributionKind" AS ENUM ('NEW_ENTITY', 'NEW_CLAIM', 'UPDATE', 'TRANSLATION', 'SAFETY_FLAG', 'DEPRECATION_REQUEST');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVE', 'REQUEST_CHANGES', 'REJECT', 'DEPRECATE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "PractitionerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "systemIri" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "registrationAuthority" TEXT,
    "jurisdictionCode" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "verifiedAt" TIMESTAMP(3),
    "verificationExpiresAt" TIMESTAMP(3),
    "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
    "conflictDisclosure" TEXT,

    CONSTRAINT "PractitionerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "identifier" TEXT,
    "issuedOn" TIMESTAMP(3),
    "expiresOn" TIMESTAMP(3),
    "privateFileKey" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "kind" "ContributionKind" NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'DRAFT',
    "riskTier" "RiskTier" NOT NULL DEFAULT 'MODERATE',
    "submissionGraphIri" TEXT NOT NULL,
    "proposedEntityIri" TEXT NOT NULL,
    "baseEntityIri" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAssignment" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "dueAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "conflictNote" TEXT,

    CONSTRAINT "ReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewDecision" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "outcome" "ReviewOutcome" NOT NULL,
    "rationale" TEXT NOT NULL,
    "reviewedRevision" INTEGER NOT NULL,
    "safetyChecked" BOOLEAN NOT NULL DEFAULT false,
    "evidenceChecked" BOOLEAN NOT NULL DEFAULT false,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "metadata" JSONB,
    "previousHash" TEXT,
    "eventHash" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PractitionerProfile_userId_key" ON "PractitionerProfile"("userId");

-- CreateIndex
CREATE INDEX "PractitionerProfile_verificationStatus_idx" ON "PractitionerProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "PractitionerProfile_systemIri_idx" ON "PractitionerProfile"("systemIri");

-- CreateIndex
CREATE INDEX "Credential_practitionerId_idx" ON "Credential"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_submissionGraphIri_key" ON "Contribution"("submissionGraphIri");

-- CreateIndex
CREATE INDEX "Contribution_status_riskTier_idx" ON "Contribution"("status", "riskTier");

-- CreateIndex
CREATE INDEX "Contribution_submittedById_status_idx" ON "Contribution"("submittedById", "status");

-- CreateIndex
CREATE INDEX "Contribution_proposedEntityIri_idx" ON "Contribution"("proposedEntityIri");

-- CreateIndex
CREATE INDEX "ReviewAssignment_reviewerId_status_dueAt_idx" ON "ReviewAssignment"("reviewerId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAssignment_contributionId_reviewerId_key" ON "ReviewAssignment"("contributionId", "reviewerId");

-- CreateIndex
CREATE INDEX "ReviewDecision_contributionId_decidedAt_idx" ON "ReviewDecision"("contributionId", "decidedAt");

-- CreateIndex
CREATE INDEX "ReviewDecision_reviewerId_decidedAt_idx" ON "ReviewDecision"("reviewerId", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_eventHash_key" ON "AuditEvent"("eventHash");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_occurredAt_idx" ON "AuditEvent"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_occurredAt_idx" ON "AuditEvent"("actorId", "occurredAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PractitionerProfile" ADD CONSTRAINT "PractitionerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "PractitionerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
