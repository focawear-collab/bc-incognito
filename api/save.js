// ─── helpers ────────────────────────────────────────────────────────────────

function bandColor(score) {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#D4A843';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

function badge(result) {
  const styles = {
    'OK':      'background:#d4edda;color:#155724',
    'Parcial': 'background:#fff3cd;color:#856404',
    'Falla':   'background:#f8d7da;color:#721c24',
    'N/A':     'background:#e9ecef;color:#495057',
  };
  const s = styles[result] || styles['N/A'];
  return `<span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;${s}">${result}</span>`;
}

function buildEmailHtml(d, catResults, notionUrl) {
  const score      = d.totalScore || 0;
  const band       = d.band || '—';
  const color      = bandColor(score);
  const logoUrl    = 'https://raw.githubusercontent.com/focawear-collab/bc-incognito/main/public/bc-logo.png';

  // Category rows
  const catRows = catResults.map(cat => {
    const status = cat.score === 100 ? 'OK' : cat.score === 50 ? 'Parcial' : 'Falla';
    const scaleLabel = cat.scale ? ` <span style="color:#999;font-size:11px">(escala: ${cat.scale}/5)</span>` : '';
    const tiempoLabel = cat.tiempoEspera != null ? ` <span style="color:#999;font-size:11px">— ${cat.tiempoEspera} min</span>` : '';
    const cleanText = (cat.selText || '').replace(/✅|⚠️|❌|🔥|❄️/g, '').trim();
    const obsRow = cat.obs ? `<tr><td colspan="2" style="padding:2px 0 8px 16px;font-size:11px;color:#999;font-style:italic">"${cat.obs}"</td></tr>` : '';
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#444">
          ${cat.name}${scaleLabel}${tiempoLabel}<br>
          <span style="font-size:11px;color:#888">${cleanText}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${badge(status)}</td>
      </tr>${obsRow}`;
  }).join('');

  // Key indicators
  let indicatorsHtml = '';
  const hasInd = d.platoPedido || d.tiempoEspera != null || d.notaGarzon || d.volveria;
  if (hasInd) {
    const rows = [];
    if (d.platoPedido) rows.push(`<tr><td style="padding:6px 0;font-size:13px;color:#555;border-bottom:1px solid #eee">🍗 Plato pedido</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px;border-bottom:1px solid #eee">${d.platoPedido}</td></tr>`);
    if (d.tiempoEspera != null) {
      const t = Number(d.tiempoEspera);
      const tc = t <= 10 ? '#22c55e' : t <= 20 ? '#f97316' : '#ef4444';
      rows.push(`<tr><td style="padding:6px 0;font-size:13px;color:#555;border-bottom:1px solid #eee">⏱️ Tiempo de espera</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:13px;color:${tc};border-bottom:1px solid #eee">${t} min</td></tr>`);
    }
    if (d.notaGarzon) {
      const stars = '★'.repeat(d.notaGarzon) + '☆'.repeat(5 - d.notaGarzon);
      rows.push(`<tr><td style="padding:6px 0;font-size:13px;color:#555;border-bottom:1px solid #eee">⭐ Nota al garzón/a</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:15px;color:#D4A843;border-bottom:1px solid #eee">${stars}</td></tr>`);
    }
    if (d.volveria) {
      const stars = '★'.repeat(d.volveria) + '☆'.repeat(5 - d.volveria);
      rows.push(`<tr><td style="padding:6px 0;font-size:13px;color:#555;border-bottom:1px solid #eee">🔁 ¿Volvería?</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:15px;color:#D4A843;border-bottom:1px solid #eee">${stars}</td></tr>`);
    }
    indicatorsHtml = `
      <div style="padding:0 24px 20px">
        <h2 style="font-size:12px;font-weight:700;color:#333;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #D4A843;padding-bottom:8px;margin:0 0 12px">Indicadores clave</h2>
        <table style="width:100%;border-collapse:collapse">${rows.join('')}</table>
      </div>`;
  }

  // General comment
  const generalHtml = d.general ? `
    <div style="padding:0 24px 20px">
      <h2 style="font-size:12px;font-weight:700;color:#333;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #D4A843;padding-bottom:8px;margin:0 0 12px">Impresión general</h2>
      <p style="font-size:13px;color:#555;line-height:1.6;margin:0;padding:12px;background:#f9f9f9;border-left:3px solid #D4A843;border-radius:4px">"${d.general}"</p>
    </div>` : '';

  // Notion link
  const notionBtn = notionUrl ? `
    <div style="padding:0 24px 24px;text-align:center">
      <a href="${notionUrl}" style="display:inline-block;background:#111;color:#D4A843;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1px solid #D4A843">Ver en Notion →</a>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f0f0f0;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.12)">

    <!-- Header -->
    <div style="background:#111;padding:24px;display:flex;align-items:center;gap:16px">
      <img src="${logoUrl}" width="64" height="64" style="border-radius:8px;background:#fff;padding:4px;object-fit:contain" alt="Black Chicken">
      <div>
        <div style="color:#D4A843;font-size:18px;font-weight:700">Cliente Incógnito</div>
        <div style="color:#888;font-size:12px;margin-top:2px">🕵️ Evaluación confidencial</div>
      </div>
    </div>

    <!-- Score banner -->
    <div style="background:#1a1a1a;padding:28px;text-align:center">
      <div style="font-size:72px;font-weight:900;color:${color};line-height:1">${score}%</div>
      <div style="font-size:16px;color:#ccc;margin-top:6px;font-weight:600">${band}</div>
    </div>

    <!-- Info grid -->
    <div style="padding:20px 24px;background:#fafafa;border-bottom:1px solid #eee">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase;width:50%">Local</td>
          <td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase">Fecha</td>
        </tr>
        <tr>
          <td style="padding:0 0 10px;font-size:15px;font-weight:700;color:#222">${d.local || '—'}</td>
          <td style="padding:0 0 10px;font-size:15px;font-weight:700;color:#222">${d.fecha || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase">Turno</td>
          <td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase">Evaluador</td>
        </tr>
        <tr>
          <td style="font-size:14px;font-weight:600;color:#444">${d.turno || '—'}</td>
          <td style="font-size:14px;font-weight:600;color:#444">${d.evaluador || 'Anónimo'}</td>
        </tr>
        ${d.garzon ? `<tr><td style="padding:10px 0 0;font-size:12px;color:#888;text-transform:uppercase">Garzón/a</td><td style="padding:10px 0 0;font-size:12px;color:#888;text-transform:uppercase">&nbsp;</td></tr><tr><td style="font-size:14px;font-weight:600;color:#444" colspan="2">${d.garzon}</td></tr>` : ''}
      </table>
    </div>

    <!-- Categories -->
    <div style="padding:20px 24px">
      <h2 style="font-size:12px;font-weight:700;color:#333;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #D4A843;padding-bottom:8px;margin:0 0 12px">Detalle por categoría</h2>
      <table style="width:100%;border-collapse:collapse">${catRows}</table>
    </div>

    ${indicatorsHtml}
    ${generalHtml}
    ${notionBtn}

    <!-- Footer -->
    <div style="background:#111;padding:16px;text-align:center">
      <p style="color:#555;font-size:11px;margin:0">BlackChicken · Evaluación Cliente Incógnito</p>
      <p style="color:#444;font-size:10px;margin:4px 0 0">Este correo es confidencial y de uso interno</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN  = process.env.NOTION_TOKEN;
  const DATABASE_ID   = process.env.NOTION_DB_ID_CI;
  const RESEND_KEY    = process.env.RESEND_API_KEY;
  const REPORT_EMAIL  = process.env.REPORT_EMAIL || 'focawear@gmail.com';

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return res.status(500).json({ error: 'Missing Notion configuration' });
  }

  try {
    const d = req.body;
    const catResults = d.catResults || [];

    const getResult = (id) => {
      const cat = catResults.find(c => c.id === id);
      if (!cat) return 'N/A';
      return cat.score === 100 ? 'OK' : cat.score === 50 ? 'Parcial' : 'Falla';
    };

    const titleStr = `${d.fecha || ''} | ${d.local || ''} | ${d.totalScore || 0}%`;

    const properties = {
      "Visita":            { title: [{ text: { content: titleStr } }] },
      "Local":             { select: { name: d.local || 'BC1' } },
      "Fecha":             { date: { start: d.fecha || new Date().toISOString().split('T')[0] } },
      "Turno":             { select: { name: d.turno || 'Almuerzo (12:00–16:00)' } },
      "Evaluador":         { rich_text: [{ text: { content: d.evaluador || '' } }] },
      "Puntuación":        { number: d.totalScore || 0 },
      "Banda":             { select: { name: d.band || 'Regular' } },
      "Cordialidad":       { select: { name: getResult('cordialidad') } },
      "Presentación Menú": { select: { name: getResult('presentacion') } },
      "Rapidez":           { select: { name: getResult('rapidez') } },
      "Bebestibles":       { select: { name: getResult('bebestibles') } },
      "Experiencia Local": { select: { name: getResult('experiencia') } },
      "Temperatura":       { select: { name: getResult('temperatura') } },
      "Retiro de Platos":  { select: { name: getResult('retiro') } },
      "Valoraciones Google": { select: { name: getResult('valoraciones') } },
    };
    if (d.garzon)  properties["Garzón"]            = { rich_text: [{ text: { content: d.garzon } }] };
    if (d.general) properties["Comentario General"] = { rich_text: [{ text: { content: d.general.substring(0, 2000) } }] };

    // ── Notion blocks ────────────────────────────────────────────────────────
    const blocks = [];

    blocks.push({ object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: `Resultado: ${d.totalScore}% — ${d.band}` } }] }
    });
    blocks.push({ object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ text: { content: 'Detalle por categoría' } }] }
    });

    catResults.forEach(cat => {
      const status = cat.score === 100 ? '✅' : cat.score === 50 ? '⚠️' : '❌';
      const scaleLabel = cat.id === 'rapidez' ? 'velocidad' : cat.id === 'calidad' ? 'calidad' : 'escala';
      const scaleStr  = cat.scale       ? ` (${scaleLabel}: ${cat.scale}/5)` : '';
      const tiempoStr = cat.tiempoEspera != null ? ` — espera: ${cat.tiempoEspera} min` : '';
      const cleanText = (cat.selText || '').replace(/✅|⚠️|❌|🔥|❄️/g, '').trim();
      blocks.push({ object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [
          { text: { content: `${status} ${cat.name}${scaleStr}${tiempoStr}: ` }, annotations: { bold: true } },
          { text: { content: cleanText } }
        ]}
      });
      if (cat.obs?.trim()) {
        blocks.push({ object: 'block', type: 'quote',
          quote: { rich_text: [{ text: { content: `Obs: ${cat.obs}` } }] }
        });
      }
    });

    const hasAdditional = d.platoPedido || d.tiempoEspera != null || d.notaGarzon || d.volveria;
    if (hasAdditional) {
      blocks.push({ object: 'block', type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Indicadores clave' } }] }
      });
      if (d.platoPedido) blocks.push({ object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [
          { text: { content: '🍗 Plato pedido: ' }, annotations: { bold: true } },
          { text: { content: d.platoPedido } }
        ]}
      });
      if (d.tiempoEspera != null) {
        const tVal = Number(d.tiempoEspera);
        const tIcon = tVal <= 10 ? '✅' : tVal <= 20 ? '⚠️' : '❌';
        blocks.push({ object: 'block', type: 'bulleted_list_item',
          bulleted_list_item: { rich_text: [
            { text: { content: '⏱️ Tiempo de espera: ' }, annotations: { bold: true } },
            { text: { content: `${tVal} min ${tIcon}` } }
          ]}
        });
      }
      if (d.notaGarzon) {
        const stars = '★'.repeat(d.notaGarzon) + '☆'.repeat(5 - d.notaGarzon);
        blocks.push({ object: 'block', type: 'bulleted_list_item',
          bulleted_list_item: { rich_text: [
            { text: { content: '⭐ Nota al garzón/a: ' }, annotations: { bold: true } },
            { text: { content: `${d.notaGarzon}/5 ${stars}` } }
          ]}
        });
      }
      if (d.volveria) {
        const stars = '★'.repeat(d.volveria) + '☆'.repeat(5 - d.volveria);
        blocks.push({ object: 'block', type: 'bulleted_list_item',
          bulleted_list_item: { rich_text: [
            { text: { content: '🔁 ¿Volvería?: ' }, annotations: { bold: true } },
            { text: { content: `${d.volveria}/5 ${stars}` } }
          ]}
        });
      }
    }

    if (d.general) {
      blocks.push({ object: 'block', type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Impresión general' } }] }
      });
      blocks.push({ object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: d.general } }] }
      });
    }

    // ── Save to Notion ───────────────────────────────────────────────────────
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties, children: blocks })
    });

    const notionResult = await notionRes.json();
    if (!notionRes.ok) {
      console.error('Notion API error:', JSON.stringify(notionResult));
      return res.status(notionRes.status).json({ error: notionResult.message || 'Notion API error' });
    }

    // ── Send email via Resend (non-blocking — email failure won't break save) ─
    if (RESEND_KEY) {
      const emailHtml = buildEmailHtml(d, catResults, notionResult.url);
      const subject   = `🕵️ CI ${d.local || ''} | ${d.fecha || ''} | ${d.totalScore || 0}% — ${d.band || ''}`;

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'BlackChicken CI <onboarding@resend.dev>',
          to: [REPORT_EMAIL],
          subject,
          html: emailHtml
        })
      }).then(r => r.json()).then(r => {
        if (r.error) console.error('Resend error:', r.error);
        else console.log('Email sent:', r.id);
      }).catch(e => console.error('Email send failed:', e.message));
    }

    return res.status(200).json({ success: true, pageId: notionResult.id, url: notionResult.url });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
