import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase, type Factura, type Cita, type Negocio } from '@/lib/supabaseClient';

// ── PDF helpers ───────────────────────────────────────────────────────────────

interface PdfOpts {
  logoDataUrl?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
}

function drawPDFHeader(doc: jsPDF, factura: Factura, opts?: PdfOpts) {
  if (!factura.emisor_nif) {
    throw new Error(
      `Factura ${factura.numero}: datos del emisor no disponibles. ` +
      `Ejecuta la migración SQL (backfill) y recarga la página.`,
    );
  }

  const isRS     = factura.serie === 'RS';
  const hasLogo  = isRS && !!opts?.logoDataUrl;
  const accentR  = isRS ? 255 : 180;
  const accentG  = isRS ? 212 : 30;
  const accentB  = isRS ? 0   : 30;

  // ── LEFT: issuer block ────────────────────────────────────────────────────
  if (hasLogo) {
    doc.addImage(opts!.logoDataUrl!, 'PNG', 14, 10, 22, 22);
    const tx = 39;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentR, accentG, accentB);
    doc.text(
      factura.emisor_nombre_comercial ?? factura.emisor_razon_social ?? '',
      tx, 19,
    );
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(`NIF: ${factura.emisor_nif}`, tx, 26);
    const domLines = doc.splitTextToSize(factura.emisor_domicilio ?? '', 100) as string[];
    doc.text(domLines, tx, 31);
    const afterDom = 31 + domLines.length * 5;
    if (opts?.telefono) {
      const telLine = opts.whatsapp
        ? `Tel: ${opts.telefono} · WA: ${opts.whatsapp}`
        : `Tel: ${opts.telefono}`;
      doc.text(telLine, tx, afterDom);
    }
  } else {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentR, accentG, accentB);
    doc.text(
      factura.emisor_nombre_comercial ?? factura.emisor_razon_social ?? '',
      14, 22,
    );
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    const nifLabel = isRS ? 'NIF' : 'CIF';
    doc.text(`${nifLabel}: ${factura.emisor_nif}`, 14, 29);
    const domLines = doc.splitTextToSize(factura.emisor_domicilio ?? '', 100) as string[];
    doc.text(domLines, 14, 34);
    const afterDom = 34 + domLines.length * 5;
    if (isRS && opts?.telefono) {
      const telLine = opts.whatsapp
        ? `Tel: ${opts.telefono} · WA: ${opts.whatsapp}`
        : `Tel: ${opts.telefono}`;
      doc.text(telLine, 14, afterDom);
      if (opts.instagram) doc.text(`Instagram: ${opts.instagram}`, 14, afterDom + 5);
    } else if (!isRS) {
      // GTI: contacto histórico (não está no snapshot — mantém-se hardcoded para facturas antigas)
      doc.text('Tel: 986 13 75 76 · 698 191 512', 14, afterDom);
      doc.text('gtimotors2023@gmail.com', 14, afterDom + 5);
    }
  }

  // ── RIGHT: invoice number + date ──────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`FACTURA Nº ${factura.numero}`, 196, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `Fecha: ${format(new Date(factura.fecha_emision), 'dd/MM/yyyy')}`,
    196, 29, { align: 'right' },
  );

  // ── SEPARATOR ─────────────────────────────────────────────────────────────
  doc.setDrawColor(accentR, accentG, accentB);
  doc.setLineWidth(0.6);
  doc.line(14, 55, 196, 55);

  // ── CLIENTE ───────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('CLIENTE', 14, 65);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const cliente = factura.clientes;
  if (cliente) {
    let ly = 73;
    doc.text(`${cliente.nombre} ${cliente.apellidos}`, 14, ly);
    if (cliente.nif)       { ly += 6; doc.text(`NIF/CIF: ${cliente.nif}`, 14, ly); }
    if (cliente.direccion) { ly += 6; doc.text(cliente.direccion, 14, ly); }
    if (cliente.codigo_postal || cliente.ciudad) {
      ly += 6;
      doc.text(`${cliente.codigo_postal ?? ''} ${cliente.ciudad ?? ''}`.trim(), 14, ly);
    }
    ly += 6; doc.text(`Tel: ${cliente.telefono}`, 14, ly);
    if (cliente.email) { ly += 6; doc.text(cliente.email, 14, ly); }
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  const footerParts = [
    factura.emisor_razon_social ?? factura.emisor_nombre_comercial,
    `NIF ${factura.emisor_nif}`,
    factura.emisor_domicilio,
  ].filter(Boolean) as string[];
  doc.text(footerParts.join(' · '), 105, 285, { align: 'center' });
}

function drawTotalBox(doc: jsPDF, tableEndY: number, total: number) {
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(120, tableEndY + 8, 76, 20, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(120, tableEndY + 8, 76, 20, 2, 2, 'S');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('TOTAL (IVA incl.)', 125, tableEndY + 20);
  doc.setTextColor(180, 30, 30);
  doc.text(`${total.toFixed(2)} €`, 193, tableEndY + 20, { align: 'right' });
}

// ── Helper: build emisor domicilio string from negocio ────────────────────────

function buildEmisorDomicilio(negocio: Negocio): string {
  const cp = negocio.codigo_postal ? `${negocio.codigo_postal} ` : '';
  return `${negocio.domicilio}, ${cp}${negocio.ciudad} (${negocio.provincia})`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFaturas() {
  const [facturas, setFacturas]               = useState<Factura[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [citasDisponibles, setCitasDisponibles] = useState<Cita[]>([]);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('facturas')
        .select('*, clientes(*), citas(*, servicios(*))')
        .order('created_at', { ascending: false });
      setFacturas((data as Factura[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCitasDisponibles = useCallback(async () => {
    const { data: citasListo } = await supabase
      .from('citas')
      .select('*, clientes(*), vehiculos(*), servicios(*)')
      .eq('estado', 'listo')
      .order('fecha', { ascending: false });

    const { data: facturasExistentes } = await supabase
      .from('facturas')
      .select('cita_id');

    const citaIdsFacturadas = new Set(
      (facturasExistentes ?? []).map((f: { cita_id: string }) => f.cita_id),
    );
    setCitasDisponibles(
      ((citasListo as Cita[]) ?? []).filter(c => !citaIdsFacturadas.has(c.id)),
    );
  }, []);

  const createFactura = useCallback(
    async (citaId: string, negocio: Negocio): Promise<Factura> => {
      const { data: cita } = await supabase
        .from('citas')
        .select('*, clientes(*), servicios(*), vehiculos(*)')
        .eq('id', citaId)
        .single();

      const total          = Number(cita?.precio_final ?? 0);
      const base_imponible = Math.round((total / 1.21) * 100) / 100;
      const iva            = Math.round((total - base_imponible) * 100) / 100;

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('next_numero_factura', { p_serie: negocio.serie_factura });
      if (rpcError) throw rpcError;
      const numero = rpcData as string;

      const { data: nuevaFactura, error } = await supabase
        .from('facturas')
        .insert({
          numero,
          cita_id:                 citaId,
          cliente_id:              cita?.cliente_id,
          base_imponible,
          iva,
          total,
          estado:                  'emitida',
          fecha_emision:           format(new Date(), 'yyyy-MM-dd'),
          emisor_razon_social:     negocio.razon_social,
          emisor_nombre_comercial: negocio.nombre_comercial,
          emisor_nif:              negocio.nif,
          emisor_domicilio:        buildEmisorDomicilio(negocio),
          serie:                   negocio.serie_factura,
        })
        .select('*, clientes(*), citas(*, servicios(*))')
        .single();

      if (error) throw error;
      return nuevaFactura as Factura;
    },
    [],
  );

  const createFacturaMensal = useCallback(
    async (clienteId: string, citaIds: string[], negocio: Negocio): Promise<Factura> => {
      const { data: citas } = await supabase
        .from('citas')
        .select('*, servicios(*), vehiculos(*)')
        .in('id', citaIds);

      const total          = ((citas as Cita[]) ?? []).reduce(
        (s, c) => s + Number(c.precio_final ?? 0), 0,
      );
      const base_imponible = Math.round((total / 1.21) * 100) / 100;
      const iva            = Math.round((total - base_imponible) * 100) / 100;

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('next_numero_factura', { p_serie: negocio.serie_factura });
      if (rpcError) throw rpcError;
      const numero = rpcData as string;

      const { data: nuevaFactura, error } = await supabase
        .from('facturas')
        .insert({
          numero,
          cita_id:                 citaIds[0],
          cliente_id:              clienteId,
          base_imponible,
          iva,
          total,
          estado:                  'emitida',
          fecha_emision:           format(new Date(), 'yyyy-MM-dd'),
          emisor_razon_social:     negocio.razon_social,
          emisor_nombre_comercial: negocio.nombre_comercial,
          emisor_nif:              negocio.nif,
          emisor_domicilio:        buildEmisorDomicilio(negocio),
          serie:                   negocio.serie_factura,
        })
        .select('*, clientes(*), citas(*, servicios(*))')
        .single();

      if (error) throw error;
      return nuevaFactura as Factura;
    },
    [],
  );

  const updateEstado = useCallback(async (id: string, estado: Factura['estado']) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id);
    if (error) throw error;
  }, []);

  const generatePDF = useCallback((factura: Factura, opts?: PdfOpts) => {
    const doc = new jsPDF();

    drawPDFHeader(doc, factura, opts);

    autoTable(doc, {
      startY: 105,
      head:   [['Descripción', 'Base imponible', 'IVA (21%)', 'Total']],
      body:   [[
        factura.citas?.servicios?.nombre ?? 'Servicio de lavado',
        `${Number(factura.base_imponible).toFixed(2)} €`,
        `${Number(factura.iva).toFixed(2)} €`,
        `${Number(factura.total).toFixed(2)} €`,
      ]],
      styles:        { fontSize: 10, cellPadding: 5 },
      headStyles:    { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold' },
      columnStyles:  {
        0: { cellWidth: 90 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });

    const tableEndY: number =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 130;

    drawTotalBox(doc, tableEndY, Number(factura.total));
    doc.save(`factura-${factura.numero}.pdf`);
  }, []);

  const generatePDFMensal = useCallback((factura: Factura, citas: Cita[], opts?: PdfOpts) => {
    const doc = new jsPDF();

    drawPDFHeader(doc, factura, opts);

    const rows = citas.map(c => [
      format(new Date(c.fecha), 'dd/MM/yyyy'),
      c.vehiculos?.matricula ?? '—',
      c.servicios?.nombre ?? 'Servicio',
      `${Number(c.precio_final ?? 0).toFixed(2)} €`,
    ]);

    const base  = Number(factura.base_imponible);
    const iva   = Number(factura.iva);
    const total = Number(factura.total);

    autoTable(doc, {
      startY: 105,
      head: [['Fecha', 'Matrícula', 'Descripción', 'Importe']],
      body: rows,
      foot: [
        ['', '', 'Base imponible', `${base.toFixed(2)} €`],
        ['', '', 'IVA (21%)',      `${iva.toFixed(2)} €`],
        ['', '', 'TOTAL',          `${total.toFixed(2)} €`],
      ],
      styles:      { fontSize: 9, cellPadding: 4 },
      headStyles:  { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold' },
      footStyles:  {
        fillColor: [248, 248, 248],
        textColor: [30, 30, 30] as [number, number, number],
        fontStyle: 'bold',
      },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    });

    const tableEndY: number =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 160;

    drawTotalBox(doc, tableEndY, total);
    doc.save(`factura-mensual-${factura.numero}.pdf`);
  }, []);

  return {
    facturas,
    loading,
    citasDisponibles,
    fetchFacturas,
    fetchCitasDisponibles,
    createFactura,
    createFacturaMensal,
    updateEstado,
    generatePDF,
    generatePDFMensal,
  };
}
