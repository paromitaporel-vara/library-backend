-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('EMAIL_CHANGE', 'PASSWORD_RESET', 'PASSWORD_CHANGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePhoto" TEXT;

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Otp_email_type_idx" ON "Otp"("email", "type");
