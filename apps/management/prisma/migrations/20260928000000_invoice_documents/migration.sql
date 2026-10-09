-- An uploaded invoice PDF attaches to its Invoice through Document.invoiceId,
-- the same shape as the ticket/change-request/suggestion attachments.
ALTER TABLE "Document" ADD COLUMN "invoiceId" INTEGER;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
