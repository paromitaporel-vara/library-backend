-- DropIndex
DROP INDEX "Otp_email_type_idx";

-- CreateIndex
CREATE INDEX "Book_title_author_idx" ON "Book"("title", "author");

-- CreateIndex
CREATE INDEX "User_email_name_idx" ON "User"("email", "name");
