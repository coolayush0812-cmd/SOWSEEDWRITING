function pdfPlain(value) {
  return String(value ?? "Not provided")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfEscape(value) {
  return pdfPlain(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function pdfLines(value, maxChars = 42, maxLines = 2) {
  const words = pdfPlain(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 3)}...`;
  }
  return lines.length ? lines : ["Not provided"];
}

function receiptDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZoneName: "short",
  });
}

function buildReceiptPdf(payment) {
  if (payment.status !== "fulfilled" || !payment.fulfilledAt || (payment.paymentStatus && payment.paymentStatus !== "COMPLETED")) {
    throw new Error("A receipt is available only after an order is fulfilled.");
  }
  const verifiedPayment = Boolean(payment.paymentStatus);
  const item = payment.itemName || payment.bookTitle || payment.pageLength || "Personal writing request";
  const orderDate = payment.paidAt || payment.createdAt;
  const orderId = payment.orderId || payment.providerOrderId || payment.id || payment.transactionId;

  const commands = [];
  const navy = [0.063, 0.169, 0.337];
  const blue = [0.09, 0.412, 0.698];
  const ink = [0.094, 0.129, 0.18];
  const muted = [0.4, 0.459, 0.541];
  const line = [0.875, 0.898, 0.925];
  const white = [1, 1, 1];
  const rgb = (color) => color.join(" ");
  const drawText = (x, y, value, size = 10, bold = false, color = ink) => {
    commands.push(`${rgb(color)} rg BT /F${bold ? 2 : 1} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`);
  };
  const drawLines = (x, y, value, maxChars = 42, size = 10, color = ink) => {
    pdfLines(value, maxChars).forEach((text, index) => drawText(x, y - index * 13, text, size, false, color));
  };
  const rule = (y) => commands.push(`${rgb(line)} RG 0.8 w 43 ${y} m 552 ${y} l S`);
  const label = (x, y, value) => drawText(x, y, value.toUpperCase(), 8, true, muted);
  const field = (x, y, title, value, maxChars = 39) => {
    label(x, y, title);
    drawLines(x, y - 18, value, maxChars, 10);
  };

  commands.push(`${rgb(white)} rg 0 0 595 842 re f`);
  commands.push(`${rgb(navy)} rg 0 737 595 105 re f`);
  drawText(43, 789, "SOWSEEDWRITING", 20, true, white);
  drawText(43, 764, "ORDER RECEIPT", 10, true, [0.867, 0.918, 0.984]);
  commands.push(`${rgb(blue)} rg 0 733 595 4 re f`);

  drawText(43, 697, verifiedPayment ? "Thank you for your purchase." : "Thank you for your order.", 16, true);
  drawText(43, 675, "Your order has been fulfilled.", 10, false, muted);
  field(43, 635, "Order status", "Fulfilled");
  label(340, 635, verifiedPayment ? "Total paid" : "Order total");
  drawText(340, 616, `$${Number(payment.amount).toFixed(2)} USD`, 14, true, navy);
  rule(597);

  drawText(43, 567, "PURCHASED ITEM", 9, true, blue);
  drawLines(43, 542, item, 68, 13);
  drawText(43, 507, "Digital order  |  One-time purchase", 9, false, muted);
  rule(490);

  drawText(43, 465, "ORDER INFORMATION", 9, true, blue);
  field(43, 440, "Customer", payment.customerName || payment.name || payment.customer_name || "PayPal buyer");
  field(318, 440, "Order date", receiptDate(orderDate));
  field(43, 390, "Order ID", orderId);
  field(318, 390, verifiedPayment ? "Transaction ID" : "Order type", verifiedPayment ? payment.transactionId : (payment.bookTitle ? "Book order" : "Personal request"));
  field(43, 340, "Contact email", payment.contactEmail || payment.customer_email || payment.email || payment.buyerEmail);
  field(318, 340, verifiedPayment ? "Buyer email" : "Fulfilled at", verifiedPayment ? payment.buyerEmail : receiptDate(payment.fulfilledAt));
  rule(308);

  drawText(43, 282, verifiedPayment ? "PAYMENT DETAILS" : "FULFILLMENT DETAILS", 9, true, blue);
  field(43, 257, verifiedPayment ? "Payment status" : "Order status", verifiedPayment ? payment.paymentStatus : "Fulfilled");
  field(318, 257, verifiedPayment ? "Payment provider" : "Fulfillment method", verifiedPayment ? "PayPal" : "Manual email delivery");
  field(43, 207, verifiedPayment ? "Provider order ID" : "Order ID", verifiedPayment ? payment.providerOrderId : orderId);
  field(318, 207, "Fulfilled at", receiptDate(payment.fulfilledAt));
  rule(174);

  drawText(43, 148, "FULFILLMENT NOTE", 9, true, blue);
  drawLines(43, 128, "This order was marked fulfilled at the date and time shown above.", 82, 9);
  rule(68);
  drawText(43, 48, "SOWSEEDWRITING", 9, true, navy);
  drawText(438, 48, "Merchant-issued receipt", 8, false, muted);

  const stream = commands.join("\n") + "\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function downloadPaymentReceipt(payment) {
  downloadReceipt(payment, payment.orderId || payment.transactionId);
}

function downloadOrderReceipt(order) {
  downloadReceipt(order, order.id);
}

function downloadReceipt(record, filenameId) {
  const bytes = buildReceiptPdf(record);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `receipt-${pdfPlain(filenameId || "order")}.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
