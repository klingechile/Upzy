const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function clp(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function publicBaseUrl() {
  return String(process.env.PUBLIC_URL || process.env.BASE_URL || process.env.UPZY_PUBLIC_BASE_URL || '').replace(/\/$/, '');
}

function quoteNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KLG-COT-${y}${m}${d}-${suffix}`;
}

async function createQuotePdf(payload) {
  const numero = quoteNumber();
  const outputDir = path.resolve(process.cwd(), 'public', 'quotes');
  fs.mkdirSync(outputDir, { recursive: true });

  const filename = `${numero}.pdf`;
  const filePath = path.join(outputDir, filename);
  const relativeUrl = `/quotes/${filename}`;
  const pdfUrl = publicBaseUrl() ? `${publicBaseUrl()}${relativeUrl}` : relativeUrl;

  const quantity = Number(payload.cantidad || 1);
  const unitPrice = Number(payload.precio_unitario || 0);
  const discount = Number(payload.descuento || 0);
  const total = Math.max(0, quantity * unitPrice - discount);
  const net = Math.round(total / 1.19);
  const iva = total - net;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(24).text('KLINGE', { align: 'left' });
    doc.fontSize(16).fillColor('#d71920').text('Cotización', { align: 'right' });
    doc.fillColor('#111').fontSize(10).text(`N° ${numero}`, { align: 'right' });
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(12).text('Cliente');
    doc.font('Helvetica').fontSize(10).text(`Nombre: ${payload.cliente_nombre}`);
    doc.text(`Mail: ${payload.cliente_mail}`);
    if (payload.cliente_telefono) doc.text(`Teléfono: ${payload.cliente_telefono}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(12).text('Detalle');
    doc.font('Helvetica').fontSize(10).text(`Producto: ${payload.producto}`);
    doc.text(`Cantidad: ${quantity}`);
    doc.text(`Precio unitario: ${clp(unitPrice)}`);
    doc.text(`Descuento: ${clp(discount)}`);
    doc.text(`Entrega: ${payload.tipo_entrega}${payload.comuna_despacho ? ' - ' + payload.comuna_despacho : ''}`);
    if (payload.vendedor) doc.text(`Vendedor: ${payload.vendedor}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(12).text('Resumen');
    doc.font('Helvetica').fontSize(10).text(`Neto: ${clp(net)}`);
    doc.text(`IVA 19%: ${clp(iva)}`);
    doc.font('Helvetica-Bold').fontSize(14).text(`Total: ${clp(total)}`);
    doc.moveDown(2);

    doc.font('Helvetica').fontSize(9).fillColor('#666').text('Cotización referencial. Documento no tributario. Valores en pesos chilenos.', { align: 'center' });
    doc.end();
  });

  return {
    success: true,
    numero_cotizacion: numero,
    pdf_url: pdfUrl,
    total,
    neto: net,
    iva,
    file_path: filePath,
  };
}

module.exports = { createQuotePdf };
