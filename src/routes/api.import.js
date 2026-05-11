// src/routes/api.import.js
// Importación de contactos desde CSV (enviado como texto en el body)

const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const config   = require('../config/env');

const TENANT_ID = config.tenantId;

// POST /api/import/csv
// Body: { csv: "...", canal: "email|whatsapp|instagram", nombre_import: "..." }
router.post('/csv', async (req, res) => {
  const { csv, canal, nombre_import } = req.body;
  if (!csv) return res.status(400).json({ error: 'csv requerido' });

  try {
    const result = parseCSV(csv);
    const { rows, headers } = result;

    if (!rows.length) return res.status(400).json({ error: 'CSV vacío o sin datos válidos' });

    // Mapear columnas
    const colMap = detectColumns(headers);

    let importados = 0, duplicados = 0, errores = 0;
    const importErrors = [];
    const batchSize = 50;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const leads = batch.map(row => {
        const nombre   = getCol(row, colMap.nombre);
        const telefono = normalizePhone(getCol(row, colMap.telefono));
        const email    = getCol(row, colMap.email)?.toLowerCase();
        const empresa  = getCol(row, colMap.empresa);
        const ciudad   = getCol(row, colMap.ciudad);
        const tipo     = getCol(row, colMap.tipo_negocio);

        // canal_id: teléfono para WA, email para email, lo que haya
        const canalDetect = canal ||
          (telefono ? 'whatsapp' : email ? 'email' : 'email');
        const canalId = canalDetect === 'whatsapp' ? telefono :
                        canalDetect === 'email'     ? email    : (telefono || email);

        if (!canalId) return null; // sin identificador, skip

        return {
          tenant_id:    TENANT_ID,
          nombre:       nombre    || null,
          empresa:      empresa   || null,
          telefono:     telefono  || null,
          email:        email     || null,
          ciudad:       ciudad    || null,
          tipo_negocio: tipo      || null,
          canal:        canalDetect,
          canal_id:     canalId,
          score:        1,
          segmento:     'cold',
          etapa:        'nuevo',
        };
      }).filter(Boolean);

      if (!leads.length) continue;

      const { data, error } = await supabase
        .from('upzy_leads')
        .upsert(leads, { onConflict: 'tenant_id,canal,canal_id', ignoreDuplicates: false })
        .select('id');

      if (error) {
        console.error('[import] batch error:', error.message);
        // Intentar uno por uno para identificar duplicados vs errores
        for (const lead of leads) {
          const { error: singleErr } = await supabase
            .from('upzy_leads')
            .insert(lead)
            .select('id');

          if (!singleErr) {
            importados++;
          } else if (singleErr.code === '23505') {
            duplicados++;
          } else {
            errores++;
            importErrors.push({ lead: lead.nombre || lead.canal_id, error: singleErr.message });
          }
        }
      } else {
        importados += data?.length || leads.length;
      }
    }

    // Registrar el import
    await supabase.from('upzy_imports').insert({
      tenant_id:  TENANT_ID,
      nombre:     nombre_import || `Import ${new Date().toLocaleDateString('es-CL')}`,
      total:      rows.length,
      importados,
      duplicados,
      errores,
      canal:      canal || 'email',
      estado:     'completado',
    });

    res.json({
      ok:          true,
      total:       rows.length,
      importados,
      duplicados,
      errores,
      columnas_detectadas: colMap,
      errores_detalle: importErrors.slice(0, 10),
    });

  } catch (err) {
    console.error('[import] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/import/historial
router.get('/historial', async (req, res) => {
  const { data } = await supabase
    .from('upzy_imports')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(20);
  res.json(data || []);
});

// GET /api/import/template — descargar template CSV
router.get('/template', (req, res) => {
  const csv = [
    'nombre,empresa,telefono,email,ciudad,tipo_negocio',
    'Carlos García,Restaurante El Sol,56912345678,carlos@elsol.cl,Santiago,Restaurante',
    'Ana Torres,Tienda Moda,56923456789,ana@moda.cl,Valparaíso,Retail',
    'Luis Méndez,Gym FitPro,,luis@fitpro.cl,Concepción,Gym',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="upzy_template_contactos.csv"');
  res.send(csv);
});

// ── HELPERS ──────────────────────────────────────────────────

function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], headers: [] };

  const sep = detectSeparator(lines[0]);
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const rows = lines.slice(1).map(line => {
    const vals = splitCSVLine(line, sep);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim().replace(/^["']|["']$/g, ''); });
    return row;
  }).filter(row => Object.values(row).some(v => v));

  return { rows, headers };
}

function detectSeparator(line) {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const c of line) if (counts[c] !== undefined) counts[c]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function splitCSVLine(line, sep) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && (i === 0 || line[i-1] === sep)) { inQuotes = true; continue; }
    if (ch === '"' && inQuotes) { inQuotes = false; continue; }
    if (ch === sep && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

const COLUMN_ALIASES = {
  nombre:       ['nombre','name','full_name','fullname','contacto','contact','cliente'],
  empresa:      ['empresa','company','negocio','business','organización','organization','razon_social'],
  telefono:     ['telefono','telefóno','phone','celular','movil','móvil','tel','whatsapp'],
  email:        ['email','correo','mail','e-mail','correo_electronico'],
  ciudad:       ['ciudad','city','localidad','comuna','region'],
  tipo_negocio: ['tipo_negocio','tipo','rubro','categoria','category','industry'],
};

function detectColumns(headers) {
  const map = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const found = headers.find(h => aliases.includes(h.toLowerCase().replace(/\s/g,'_')));
    if (found) map[field] = found;
  }
  return map;
}

function getCol(row, colName) {
  if (!colName || !row[colName]) return null;
  return row[colName]?.trim() || null;
}

function normalizePhone(tel) {
  if (!tel) return null;
  let t = String(tel).replace(/[\s\-\(\)\.]/g, '');
  if (t.startsWith('+')) t = t.slice(1);
  if (t.startsWith('0')) t = t.slice(1);
  if (t.startsWith('9') && t.length === 9) t = '56' + t;
  if (t.startsWith('56') && t.length === 11) return t;
  if (t.length >= 8) return t; // número extranjero, guardar igual
  return null;
}

module.exports = router;
