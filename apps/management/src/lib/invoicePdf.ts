import PDFDocument from "pdfkit";

interface InvoiceForPdf {
  id: number;
  description: string;
  amountExGst: string;
  gstAmount: string;
  totalAmount: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  paidAt: Date | null;
}

interface ClientForPdf {
  name: string;
  company: string;
  contactEmail: string;
}

const AUD = (n: string) => `$${(parseFloat(n) || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const DATE = (d: Date) => d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });

// Renders a valid-shaped Australian tax invoice (seller details + ABN, GST
// breakdown, invoice number, dates) as a PDF buffer. One line item per
// invoice, matching the Invoice model — this isn't a general multi-line
// invoicing engine, just what this app's Invoice actually holds.
export function renderInvoicePdf(invoice: InvoiceForPdf, client: ClientForPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invoiceNumber = `INV-${String(invoice.id).padStart(4, "0")}`;

    // Seller (Web Quokka) header
    doc.fontSize(20).fillColor("#3a5a40").text("Web Quokka", 50, 50);
    doc.fontSize(9).fillColor("#6b5646");
    doc.text("Perth, Western Australia");
    doc.text("quokkasupport@gmail.com  ·  0414 093 339");
    doc.text(`ABN: ${process.env.WEBQUOKKA_ABN || "Not yet provided"}`);

    doc.fontSize(16).fillColor("#2e1e13").text("TAX INVOICE", 350, 50, { align: "right" });
    doc.fontSize(9).fillColor("#6b5646");
    doc.text(invoiceNumber, 350, 74, { align: "right" });
    doc.text(`Issued: ${DATE(invoice.issueDate)}`, 350, 88, { align: "right" });
    if (invoice.dueDate) doc.text(`Due: ${DATE(invoice.dueDate)}`, 350, 102, { align: "right" });

    doc.moveTo(50, 130).lineTo(545, 130).strokeColor("#e6dccb").stroke();

    // Bill to
    doc.fontSize(10).fillColor("#6b5646").text("BILL TO", 50, 145);
    doc.fontSize(11).fillColor("#2e1e13").text(client.company || client.name, 50, 160);
    if (client.contactEmail) doc.fontSize(9).fillColor("#6b5646").text(client.contactEmail, 50, 176);

    // Line item table
    const tableTop = 220;
    doc.fontSize(9).fillColor("#6b5646");
    doc.text("DESCRIPTION", 50, tableTop);
    doc.text("AMOUNT (EX. GST)", 400, tableTop, { width: 145, align: "right" });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#e6dccb").stroke();

    doc.fontSize(10).fillColor("#2e1e13");
    doc.text(invoice.description, 50, tableTop + 25, { width: 330 });
    doc.text(AUD(invoice.amountExGst), 400, tableTop + 25, { width: 145, align: "right" });

    const totalsTop = tableTop + 70;
    doc.moveTo(350, totalsTop).lineTo(545, totalsTop).strokeColor("#e6dccb").stroke();
    doc.fontSize(9).fillColor("#6b5646");
    doc.text("Subtotal (ex. GST)", 350, totalsTop + 10, { width: 100 });
    doc.text(AUD(invoice.amountExGst), 400, totalsTop + 10, { width: 145, align: "right" });
    doc.text("GST (10%)", 350, totalsTop + 25, { width: 100 });
    doc.text(AUD(invoice.gstAmount), 400, totalsTop + 25, { width: 145, align: "right" });
    doc.fontSize(12).fillColor("#2e1e13");
    doc.text("Total (AUD)", 350, totalsTop + 44, { width: 100 });
    doc.text(AUD(invoice.totalAmount), 400, totalsTop + 44, { width: 145, align: "right" });

    doc.fontSize(10);
    if (invoice.status === "Paid" && invoice.paidAt) {
      doc.fillColor("#3a5a40").text(`PAID on ${DATE(invoice.paidAt)}`, 350, totalsTop + 70, { width: 195, align: "right" });
    } else {
      doc.fillColor("#9a3412").text(invoice.status.toUpperCase(), 350, totalsTop + 70, { width: 195, align: "right" });
    }

    doc.fontSize(8).fillColor("#8a7258").text("Thank you for your business.", 50, 760, { align: "center", width: 495 });

    doc.end();
  });
}
