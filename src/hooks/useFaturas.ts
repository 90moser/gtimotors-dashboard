import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase, type Factura, type Cita } from '@/lib/supabaseClient';

// ── Shared PDF helpers ─────────────────────────────────────────────────────────

function drawPDFHeader(doc: jsPDF, factura: Factura) {
  // Company
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 30, 30);
  doc.text('GTIMotors 2020 SLU', 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text('CIF: B23860984', 14, 29);
  doc.text('Travesia de Vigo 105 Bajo', 14, 34);
  doc.text('36205, Vigo (Pontevedra), España', 14, 39);
  doc.text('Tel: 986 13 75 76 · 698 191 512', 14, 44);
  doc.text('gtimotors2023@gmail.com', 14, 49);

  // Invoice number + date (right aligned)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`FACTURA Nº ${factura.numero}`, 196, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `Fecha: ${format(new Date(factura.fecha_emision), 'dd/MM/yyyy')}`,
    196, 29, { align: 'right' }
  );

  // Red divider
  doc.setDrawColor(180, 30, 30);
  doc.setLineWidth(0.6);
  doc.line(14, 55, 196, 55);

  // Client
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('CLIENTE', 14, 65);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const cliente = factura.clientes;
  if (cliente) {
    let lineY = 73;
    doc.text(`${cliente.nombre} ${cliente.apellidos}`, 14, lineY);
    if (cliente.nif) { lineY += 6; doc.text(`NIF/CIF: ${cliente.nif}`, 14, lineY); }
    if (cliente.direccion) { lineY += 6; doc.text(cliente.direccion, 14, lineY); }
    if (cliente.codigo_postal || cliente.ciudad) {
      lineY += 6;
      doc.text(`${cliente.codigo_postal ?? ''} ${cliente.ciudad ?? ''}`.trim(), 14, lineY);
    }
    lineY += 6; doc.text(`Tel: ${cliente.telefono}`, 14, lineY);
    if (cliente.email) { lineY += 6; doc.text(`Email: ${cliente.email}`, 14, lineY); }
  }

  // Page footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text(
    'GTIMotors 2020 SLU · CIF B23860984 · Travesia de Vigo 105 Bajo · 36205, Vigo (Pontevedra)',
    105, 285, { align: 'center' }
  );
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFaturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
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
      (facturasExistentes ?? []).map((f: { cita_id: string }) => f.cita_id)
    );
    setCitasDisponibles(
      ((citasListo as Cita[]) ?? []).filter((c) => !citaIdsFacturadas.has(c.id))
    );
  }, []);

  // Shared: get next sequential invoice number
  async function getNextNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const { data: lastFactura } = await supabase
      .from('facturas')
      .select('numero')
      .ilike('numero', `${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastFactura?.numero) {
      const parts = (lastFactura.numero as string).split('-');
      if (parts.length === 2) nextNum = parseInt(parts[1], 10) + 1;
    }
    return `${year}-${String(nextNum).padStart(4, '0')}`;
  }

  const createFactura = useCallback(async (citaId: string): Promise<Factura> => {
    const { data: cita } = await supabase
      .from('citas')
      .select('*, clientes(*), servicios(*), vehiculos(*)')
      .eq('id', citaId)
      .single();

    const total          = Number(cita?.precio_final ?? 0);
    const base_imponible = Math.round((total / 1.21) * 100) / 100;
    const iva            = Math.round((total - base_imponible) * 100) / 100;
    const numero         = await getNextNumero();

    const { data: nuevaFactura, error } = await supabase
      .from('facturas')
      .insert({
        numero,
        cita_id: citaId,
        cliente_id: cita?.cliente_id,
        base_imponible,
        iva,
        total,
        estado: 'emitida',
        fecha_emision: format(new Date(), 'yyyy-MM-dd'),
      })
      .select('*, clientes(*), citas(*, servicios(*))')
      .single();

    if (error) throw error;
    return nuevaFactura as Factura;
  }, []);

  const createFacturaMensal = useCallback(
    async (clienteId: string, citaIds: string[]): Promise<Factura> => {
      const { data: citas } = await supabase
        .from('citas')
        .select('*, servicios(*), vehiculos(*)')
        .in('id', citaIds);

      const total          = ((citas as Cita[]) ?? []).reduce((s, c) => s + Number(c.precio_final ?? 0), 0);
      const base_imponible = Math.round((total / 1.21) * 100) / 100;
      const iva            = Math.round((total - base_imponible) * 100) / 100;
      const numero         = await getNextNumero();

      const { data: nuevaFactura, error } = await supabase
        .from('facturas')
        .insert({
          numero,
          cita_id: citaIds[0],
          cliente_id: clienteId,
          base_imponible,
          iva,
          total,
          estado: 'emitida',
          fecha_emision: format(new Date(), 'yyyy-MM-dd'),
        })
        .select('*, clientes(*), citas(*, servicios(*))')
        .single();

      if (error) throw error;
      return nuevaFactura as Factura;
    },
    []
  );

  const updateEstado = useCallback(async (id: string, estado: Factura['estado']) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id);
    if (error) throw error;
  }, []);

  const generatePDF = useCallback((factura: Factura) => {
    const doc = new jsPDF();

    drawPDFHeader(doc, factura);

    autoTable(doc, {
      startY: 105,
      head: [['Descripción', 'Base imponible', 'IVA (21%)', 'Total']],
      body: [[
        factura.citas?.servicios?.nombre ?? 'Servicio de lavado',
        `${Number(factura.base_imponible).toFixed(2)} €`,
        `${Number(factura.iva).toFixed(2)} €`,
        `${Number(factura.total).toFixed(2)} €`,
      ]],
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
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

  const generatePDFMensal = useCallback((factura: Factura, citas: Cita[]) => {
    const doc = new jsPDF();

    drawPDFHeader(doc, factura);

    const rows = citas.map((c) => [
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
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [248, 248, 248], textColor: [30, 30, 30] as [number, number, number], fontStyle: 'bold' },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
      },
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
