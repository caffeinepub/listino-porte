export interface PriceTierInfo {
  minQ: number;
  maxQ: number | null;
  price: number;
}

export interface ExtraInfo {
  name: string;
  price: number;
}

export interface PrintData {
  clientName: string;
  doorTypeName: string;
  quantity: number;
  activeTier: PriceTierInfo | null;
  selectedExtras: ExtraInfo[];
  baseTotal: number;
  extrasTotal: number;
  grandTotal: number;
  allTiers: PriceTierInfo[];
}

export function generatePrintPDF(data: PrintData) {
  const today = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formatEur = (n: number) =>
    new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(n);

  const tierLabel = (t: PriceTierInfo) =>
    t.maxQ ? `${t.minQ} – ${t.maxQ} unità` : `${t.minQ}+ unità`;

  const tiersRows = data.allTiers
    .map(
      (t, i) => `
    <tr class="${data.activeTier && data.activeTier.minQ === t.minQ ? "active-tier" : ""}">
      <td>${i + 1}</td>
      <td>${t.minQ}</td>
      <td>${t.maxQ ?? "∞"}</td>
      <td>${formatEur(t.price)}</td>
      <td>${data.activeTier && data.activeTier.minQ === t.minQ ? "✓ Applicata" : ""}</td>
    </tr>`,
    )
    .join("");

  const extrasRows = data.selectedExtras
    .map(
      (e) =>
        `<tr><td>${e.name}</td><td>${formatEur(e.price)}/unità</td><td>${formatEur(e.price * data.quantity)}</td></tr>`,
    )
    .join("");

  const fasciaApplicata = data.activeTier
    ? `${tierLabel(data.activeTier)} @ ${formatEur(data.activeTier.price)}/unità`
    : "N/D";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Preventivo - ${data.clientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #3B73B9; padding-bottom: 20px; }
    .company-name { font-size: 26px; font-weight: 700; color: #3B73B9; }
    .company-sub { font-size: 12px; color: #666; margin-top: 2px; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 600; color: #3B73B9; }
    .doc-meta { font-size: 12px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #3B73B9; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #dde4ef; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .info-item label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
    .info-item span { display: block; font-weight: 600; font-size: 14px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0f4fb; color: #3B73B9; font-weight: 700; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 8px 12px; border-bottom: 1px solid #eef0f5; }
    tr.active-tier td { background: #eaf2ff; font-weight: 700; color: #3B73B9; }
    .total-box { background: #f0f4fb; border: 2px solid #3B73B9; border-radius: 8px; padding: 20px 24px; margin-top: 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-row.grand { font-size: 20px; font-weight: 700; color: #3B73B9; border-top: 1px solid #dde4ef; margin-top: 8px; padding-top: 12px; }
    .footer { margin-top: 40px; border-top: 1px solid #eef0f5; padding-top: 12px; font-size: 11px; color: #aaa; text-align: center; }
    .badge { display: inline-block; background: #e8f4e8; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">ListinoPorte</div>
      <div class="company-sub">Gestione Listini Prezzi — Porte su Misura</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">PREVENTIVO</div>
      <div class="doc-meta">Data: ${today}</div>
      <div class="doc-meta"><span class="badge">IVA ESCLUSA</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dati Cliente e Configurazione</div>
    <div class="info-grid">
      <div class="info-item"><label>Cliente</label><span>${data.clientName}</span></div>
      <div class="info-item"><label>Tipo Porta</label><span>${data.doorTypeName}</span></div>
      <div class="info-item"><label>Quantità</label><span>${data.quantity} unità</span></div>
      <div class="info-item"><label>Fascia Applicata</label><span>${fasciaApplicata}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Fasce di Prezzo — ${data.doorTypeName}</div>
    <table>
      <thead><tr><th>Livello</th><th>Q.tà Min</th><th>Q.tà Max</th><th>Prezzo Unitario</th><th>Stato</th></tr></thead>
      <tbody>${tiersRows}</tbody>
    </table>
  </div>

  ${
    data.selectedExtras.length > 0
      ? `
  <div class="section">
    <div class="section-title">Opzioni Aggiuntive</div>
    <table>
      <thead><tr><th>Opzione</th><th>Prezzo/Unità</th><th>Totale (×${data.quantity})</th></tr></thead>
      <tbody>${extrasRows}</tbody>
    </table>
  </div>`
      : ""
  }

  <div class="total-box">
    <div class="total-row"><span>Prezzo base (${formatEur(data.activeTier?.price ?? 0)} × ${data.quantity} unità)</span><span>${formatEur(data.baseTotal)}</span></div>
    ${data.selectedExtras.length > 0 ? `<div class="total-row"><span>Totale opzioni aggiuntive</span><span>${formatEur(data.extrasTotal)}</span></div>` : ""}
    <div class="total-row grand"><span>TOTALE (IVA esclusa)</span><span>${formatEur(data.grandTotal)}</span></div>
  </div>

  <div class="footer">Preventivo generato il ${today} — Prezzi IVA esclusa — Valido 30 giorni dalla data di emissione</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Abilita i popup del browser per generare il PDF.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
