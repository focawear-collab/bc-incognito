export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_DB_ID_CI;

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return res.status(500).json({ error: 'Missing Notion configuration (NOTION_TOKEN or NOTION_DB_ID_CI)' });
  }

  try {
    const d = req.body;
    const catResults = d.catResults || [];

    const getResult = (id) => {
      const cat = catResults.find(c => c.id === id);
      if (!cat) return 'N/A';
      return cat.score === 100 ? 'OK' : cat.score === 50 ? 'Parcial' : 'Falla';
    };

    // Title: "2026-03-14 | BC1 | 87%"
    const titleStr = `${d.fecha || ''} | ${d.local || ''} | ${d.totalScore || 0}%`;

    const properties = {
      "Visita": { title: [{ text: { content: titleStr } }] },
      "Local": { select: { name: d.local || 'BC1' } },
      "Fecha": { date: { start: d.fecha || new Date().toISOString().split('T')[0] } },
      "Turno": { select: { name: d.turno || 'Almuerzo (12:00–16:00)' } },
      "Evaluador": { rich_text: [{ text: { content: d.evaluador || '' } }] },
      "Puntuación": { number: d.totalScore || 0 },
      "Banda": { select: { name: d.band || 'Regular' } },
      "Cordialidad": { select: { name: getResult('cordialidad') } },
      "Presentación Menú": { select: { name: getResult('presentacion') } },
      "Rapidez": { select: { name: getResult('rapidez') } },
      "Bebestibles": { select: { name: getResult('bebestibles') } },
      "Experiencia Local": { select: { name: getResult('experiencia') } },
      "Temperatura": { select: { name: getResult('temperatura') } },
      "Retiro de Platos": { select: { name: getResult('retiro') } },
      "Valoraciones Google": { select: { name: getResult('valoraciones') } },
    };

    if (d.garzon) {
      properties["Garzón"] = { rich_text: [{ text: { content: d.garzon } }] };
    }
    if (d.general) {
      properties["Comentario General"] = { rich_text: [{ text: { content: d.general.substring(0, 2000) } }] };
    }

    // Build content blocks
    const blocks = [];

    // Summary heading
    blocks.push({
      object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: `Resultado: ${d.totalScore}% — ${d.band}` } }] }
    });

    // Category detail
    blocks.push({
      object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ text: { content: 'Detalle por categoría' } }] }
    });

    catResults.forEach(cat => {
      const status = cat.score === 100 ? '✅' : cat.score === 50 ? '⚠️' : '❌';
      const scaleStr = cat.scale ? ` (rapidez: ${cat.scale}/5)` : '';
      const cleanText = (cat.selText || '').replace(/✅|⚠️|❌|🔥|❄️/g, '').trim();
      blocks.push({
        object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: `${status} ${cat.name}${scaleStr}: ` }, annotations: { bold: true } },
            { text: { content: cleanText } }
          ]
        }
      });
      if (cat.obs && cat.obs.trim()) {
        blocks.push({
          object: 'block', type: 'quote',
          quote: { rich_text: [{ text: { content: `Obs: ${cat.obs}` } }] }
        });
      }
    });

    // General comment
    if (d.general) {
      blocks.push({
        object: 'block', type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: 'Impresión general' } }] }
      });
      blocks.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: d.general } }] }
      });
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties,
        children: blocks
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Notion API error:', JSON.stringify(result));
      return res.status(response.status).json({ error: result.message || 'Notion API error' });
    }

    return res.status(200).json({ success: true, pageId: result.id, url: result.url });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
