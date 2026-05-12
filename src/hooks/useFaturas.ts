import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase, type Factura, type Cita } from '@/lib/supabaseClient';

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

  const createFactura = useCallback(async (citaId: string): Promise<Factura> => {
    const { data: cita } = await supabase
      .from('citas')
      .select('*, clientes(*), servicios(*), vehiculos(*)')
      .eq('id', citaId)
      .single();

    const total          = Number(cita?.precio_final ?? 0);
    const base_imponible = Math.round((total / 1.21) * 100) / 100;
    const iva            = Math.round((total - base_imponible) * 100) / 100;

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
    const numero = `${year}-${String(nextNum).padStart(4, '0')}`;

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

  const updateEstado = useCallback(async (id: string, estado: Factura['estado']) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id);
    if (error) throw error;
  }, []);

  const generatePDF = useCallback((factura: Factura) => {
    const doc = new jsPDF();

    // Company header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 30, 30);
    doc.text('GTIMotors 2020 SLU', 14, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text('NIF: B23860984', 14, 29);
    doc.text('Vigo, España', 14, 34);

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
      196,
      29,
      { align: 'right' }
    );

    // Red divider
    doc.setDrawColor(180, 30, 30);
    doc.setLineWidth(0.6);
    doc.line(14, 40, 196, 40);

    // Client data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('DATOS DEL CLIENTE', 14, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    const cliente = factura.clientes;
    if (cliente) {
      let lineY = 60;
      doc.text(`${cliente.nombre} ${cliente.apellidos}`, 14, lineY);
      lineY += 6;
      doc.text(`Tel: ${cliente.telefono}`, 14, lineY);
      if (cliente.email) { lineY += 6; doc.text(`Email: ${cliente.email}`, 14, lineY); }
      if (cliente.nif)   { lineY += 6; doc.text(`NIF/DNI: ${cliente.nif}`, 14, lineY); }
    }

    // Services table
    autoTable(doc, {
      startY: 88,
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

    // Total highlighted box
    const tableEndY: number =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 118;

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(120, tableEndY + 8, 76, 20, 2, 2, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(120, tableEndY + 8, 76, 20, 2, 2, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('TOTAL (IVA incl.)', 125, tableEndY + 20);
    doc.setTextColor(180, 30, 30);
    doc.text(`${Number(factura.total).toFixed(2)} €`, 193, tableEndY + 20, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(
      'GTIMotors 2020 SLU · NIF B23860984 · Vigo, España',
      105,
      285,
      { align: 'center' }
    );

    doc.save(`factura-${factura.numero}.pdf`);
  }, []);

  return {
    facturas,
    loading,
    citasDisponibles,
    fetchFacturas,
    fetchCitasDisponibles,
    createFactura,
    updateEstado,
    generatePDF,
  };
}
