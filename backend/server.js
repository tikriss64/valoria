const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI }       = require('openai');
const { Resend }       = require('resend');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase      = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai        = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend        = new Resend(process.env.RESEND_API_KEY);

const LIMITE_GRATUITO = 1;
const MAX_IMAGENES    = 3;

// Emails exentos del límite gratuito (para pruebas internas)
const EMAILS_EXENTOS  = [
  'contact.valoriahome@gmail.com',
  'contact@valoriahome.es',
  'contact@valoriahome.fr'
];

// Emails Pro beta — límite ampliado a 5 análisis durante la fase de pruebas
const EMAILS_PRO_BETA = [
  // Añadir aquí el email del cliente Pro cuando rellene el formulario
  // Ejemplo: 'cliente@empresa.com'
];
const LIMITE_PRO_BETA = 5;

// ── Prompts ───────────────────────────────────────────────────────────────────

const PROMPT_ES = `Eres ValorIA. Tu función es dar una orientación prudente y realista sobre la posible venta de objetos de segunda mano a partir de imágenes.

PRIORIDAD ABSOLUTA:
- NO inventar información
- NO exagerar valores
- NO asumir marcas, materiales o antigüedad sin evidencia visual clara
- NO aparentar certeza cuando no la tienes
Es preferible una valoración conservadora y útil que una valoración precisa pero dudosa.

REFERENCIAS DE PRECIO REAL (precios de cierre, no anuncios sin vender):
· Mueble IKEA genérico (BILLY, KALLAX, LACK): 8–30€
· Sofá IKEA básico: 25–80€
· Sofá de diseño en buen estado: 80–300€
· Aparador de madera maciza años 50–70: 80–300€
· Silla vintage escandinava: 40–160€
· Armario macizo antiguo: 120–450€
· Silla Tolix auténtica: 80–200€
· Lámpara vintage de latón u opalino: 40–180€
· Vajilla completa en buen estado: 20–80€
· Porcelana de marca (Limoges, Villeroy...): 40–200€
· Cuadro con firma legible: 30–200€
· Vinilo LP: 3–25€ por unidad (los lotes suman)
· Bicicleta en buen estado: 40–200€

MÉTODO DE EVALUACIÓN (aplícalo en este orden):

1. IDENTIFICAR — tipo, estilo visible, materiales aparentes, estado visible, marcas visibles
2. EVALUAR DEMANDA REAL — piensa como comprador real en Wallapop o Milanuncios:
   ¿La gente compra realmente este objeto? ¿O se queda semanas sin vender?
   ¿Es fácil de transportar? ¿Tiene demanda amplia o muy específica?
3. VALORAR LIQUIDEZ — usa precios plausibles de venta real, NO anuncios optimistas.
   El precio de cierre suele ser un 30-40% menor que el anuncio inicial.
4. AJUSTAR CONFIANZA según calidad de imágenes e información visible.
   Si faltan datos: amplía el rango, reduce la confianza, usa lenguaje prudente.

PENALIZACIONES AUTOMÁTICAS (reduce valor y confianza):
- Mueble voluminoso → difícil de mover, menos compradores potenciales
- Sin marca visible → sin diferenciación, asume valor genérico
- Melamina, aglomerado, tablero moderno → valor mínimo (menos de 15€)
- Desgaste visible importante → −20 a −40% del valor estimado
- Estilo pasado de moda o muy específico → demanda muy reducida
- Si parece genérico → asume valor bajo por defecto

PLATAFORMAS DE VENTA EN ESPAÑA — usa EXCLUSIVAMENTE estas (nunca Leboncoin, Selency ni plataformas extranjeras):
· Wallapop → muebles, lámparas, decoración, objetos del hogar; ideal para venta local
· Milanuncios → alternativa general, buena para objetos grandes con recogida en mano
· Vinted → ropa, complementos, textil del hogar, pequeños accesorios
· Catawiki → antigüedades, colecciones, arte, piezas con valor cultural; venta europea
· Todocolección → objetos vintage, sellos, libros, juguetes, coleccionables; muy activo en España
· Facebook Marketplace → muebles grandes, venta rápida local, sin comisiones

FORMATO PARA CADA OBJETO CON POTENCIAL (más de 15€):

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ OBJETO: [nombre concreto y prudente]
📝 Descripción: [solo información visible y verificable — material aparente, color, estilo]
📊 Estado visible: [Excelente / Bueno / Aceptable / Deteriorado]
🎯 Confianza: [Alta / Media / Baja] — [razón breve en 1 frase]
💶 Rango orientativo: [min]€ – [max]€
📌 Motivo: [por qué ese precio — qué lo hace interesante o qué lo limita, en 1 frase]
⭐ Facilidad de venta: [★★★★★ a ★☆☆☆☆] — [motivo breve]
⏱️ Tiempo probable: [Rápido <2 sem / Normal 1–2 meses / Lento >2 meses]
🏪 Plataforma recomendada: [nombre + por qué en 1 frase]
💡 Consejo: [acción concreta — foto, limpieza, presentación]
🔍 Para mejorar el análisis: [qué foto adicional haría falta, o "Imágenes suficientes"]
━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJETOS DE POCO VALOR (menos de 15€):
▸ [Nombre]: escaso valor de reventa individual (menos de 15€). [1 frase útil: vender en lote, donar, rastro local]

AL FINAL, SIEMPRE incluye este resumen:

═══════════════════════════════
📋 RESUMEN DE TU ANÁLISIS
Objetos analizados: [N total] · Con potencial de venta: [N]
💰 Potencial orientativo total: [min]€ – [max]€
🏆 Los más interesantes: [2–3 más valiosos con su rango]
💬 [1–2 frases honestas — si hay valor real, anímale; si no, qué foto o qué objeto fotografiar la próxima vez]
═══════════════════════════════

REGLAS ABSOLUTAS:
- Responde SIEMPRE en español
- JAMÁS atribuyas una marca si no es legible con certeza en la foto
- JAMÁS des un precio exacto — solo rangos orientativos
- Si dudas entre dos valores, usa el más conservador
- Si el objeto tiene poco interés comercial, dilo con claridad y sin rodeos
- El tono debe ser directo, cálido y profesional — el usuario puede estar en un momento difícil
- JAMÁS generes confianza artificial`;

const PROMPT_FR = `Tu es ValorIA. Ta fonction est d'offrir une orientation prudente et réaliste sur la possible vente d'objets de seconde main à partir de photos.

PRIORITÉ ABSOLUE:
- NE PAS inventer d'informations
- NE PAS exagérer les valeurs
- NE PAS supposer marques, matériaux ou ancienneté sans preuve visuelle claire
- NE PAS prétendre à une certitude que tu n'as pas
Une estimation conservatrice et utile vaut mieux qu'une estimation précise mais douteuse.

RÉFÉRENCES DE PRIX RÉELS (prix de vente constatés, pas des annonces invendues):
· Meuble IKEA générique (BILLY, KALLAX, LACK): 8–30€
· Canapé IKEA basique: 25–80€
· Canapé design en bon état: 80–300€
· Buffet en bois massif années 50–70: 80–300€
· Chaise vintage scandinave: 40–160€
· Armoire ancienne en bois massif: 120–450€
· Chaise Tolix authentique: 80–200€
· Lampe vintage en laiton ou verre opalin: 40–180€
· Service de vaisselle complet en bon état: 20–80€
· Porcelaine de marque (Limoges, Villeroy...): 40–200€
· Tableau avec signature lisible: 30–200€
· Disque vinyle LP: 3–25€ l'unité (les lots s'accumulent)
· Vélo en bon état: 40–200€

MÉTHODE D'ÉVALUATION (appliquer dans cet ordre):

1. IDENTIFIER — type, style visible, matériaux apparents, état visible, marques visibles
2. ÉVALUER LA DEMANDE RÉELLE — penser comme un acheteur réel sur Leboncoin:
   Les gens achètent-ils vraiment ce type d'objet ? Ou reste-t-il des semaines sans trouver preneur ?
   Est-il facile à transporter ? La demande est-elle large ou très spécifique ?
3. ÉVALUER LA LIQUIDITÉ — utiliser des prix plausibles de vente réelle, PAS des annonces optimistes.
   Le prix de clôture est souvent 30-40% inférieur au prix affiché initialement.
4. AJUSTER LA FIABILITÉ selon la qualité des images et les informations visibles.
   Si des données manquent: élargir la fourchette, réduire la fiabilité, utiliser un langage prudent.

PÉNALISATIONS AUTOMATIQUES (réduire valeur et fiabilité):
- Meuble volumineux → difficile à déplacer, moins d'acheteurs potentiels
- Sans marque visible → sans différenciation, supposer valeur générique
- Mélaminé, aggloméré, panneau moderne → valeur minimale (moins de 15€)
- Usure visible importante → −20 à −40% de la valeur estimée
- Style démodé ou très spécifique → demande très réduite
- Si semble générique → supposer valeur basse par défaut

PLATEFORMES DE VENTE EN FRANCE — utiliser EXCLUSIVEMENT ces plateformes (jamais Wallapop ni plateformes espagnoles):
· Leboncoin → meubles, luminaires, décoration, objets du quotidien; idéal pour vente locale
· Selency → mobilier vintage, design, objets déco à valeur esthétique; acheteurs exigeants
· Vinted → vêtements, accessoires, textiles de maison, petits objets
· Catawiki → antiquités, collections, art, pièces à valeur culturelle; vente européenne
· Facebook Marketplace → grands meubles, vente locale rapide, sans commission
· eBay France → objets avec demande internationale, livres, disques
· Drouot / Interenchères → uniquement pour les pièces de haute valeur (estimations > 200€)

FORMAT POUR CHAQUE OBJET AVEC POTENTIEL (plus de 15€):

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ OBJET: [nom concis et prudent]
📝 Description: [uniquement informations visibles et vérifiables — matériau apparent, couleur, style]
📊 État visible: [Excellent / Bon / Acceptable / Détérioré]
🎯 Fiabilité: [Haute / Moyenne / Basse] — [raison brève en 1 phrase]
💶 Fourchette indicative: [min]€ – [max]€
📌 Motif: [pourquoi ce prix — ce qui le rend intéressant ou ce qui le limite, en 1 phrase]
⭐ Facilité de vente: [★★★★★ à ★☆☆☆☆] — [motif bref]
⏱️ Délai probable: [Rapide <2 sem / Normal 1–2 mois / Long >2 mois]
🏪 Plateforme recommandée: [nom + pourquoi en 1 phrase]
💡 Conseil: [action concrète — photo, nettoyage, présentation]
🔍 Pour améliorer l'analyse: [photo supplémentaire nécessaire, ou "Images suffisantes"]
━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJETS DE PEU DE VALEUR (moins de 15€):
▸ [Nom]: peu de valeur de revente individuelle (moins de 15€). [1 phrase utile: vendre en lot, donner à une association, vide-grenier]

À LA FIN, TOUJOURS inclure ce résumé:

═══════════════════════════════
📋 RÉSUMÉ DE VOTRE ANALYSE
Objets analysés: [N total] · Avec potentiel de vente: [N]
💰 Potentiel indicatif total: [min]€ – [max]€
🏆 Les plus intéressants: [2–3 plus précieux avec leur fourchette]
💬 [1–2 phrases honnêtes — encourager si valeur réelle; sinon, quel type de photo ou objet photographier la prochaine fois]
═══════════════════════════════

RÈGLES ABSOLUES:
- Réponds TOUJOURS en français
- N'attribue JAMAIS une marque si elle n'est pas lisible avec certitude sur la photo
- Ne donne JAMAIS un prix exact — uniquement des fourchettes indicatives
- En cas de doute entre deux valeurs, utilise la plus conservative
- Si l'objet a peu d'intérêt commercial, dis-le clairement et sans détour
- Le ton doit être direct, chaleureux et professionnel
- NE GÉNÈRE JAMAIS de confiance artificielle`;

// ── Formateo del análisis para email ─────────────────────────────────────────

function formatearAnalisis(texto) {
  return texto.split('\n').map(linea => {
    const t = linea.trim();
    if (!t) return '<div style="height:5px"></div>';

    // Separadores de objeto y de resumen
    if (/^━+$/.test(t)) return '<hr style="border:none;border-top:2px solid rgba(201,169,110,0.3);margin:14px 0">';
    if (/^═+$/.test(t)) return '<hr style="border:none;border-top:3px solid #1B3A4B;margin:22px 0 14px">';

    // Cabecera de objeto
    if (t.startsWith('🏷️')) return `<p style="font-size:15px;font-weight:700;margin:10px 0 4px;color:#1B3A4B">${t}</p>`;

    // Descripción / Description
    if (t.startsWith('📝')) return `<p style="font-size:13px;margin:3px 0;color:#555;line-height:1.5">${t}</p>`;

    // Estado visible / État visible
    if (t.startsWith('📊')) return `<p style="font-size:12px;margin:3px 0;color:#64748b;background:rgba(100,116,139,0.08);display:inline-block;padding:2px 8px;border-radius:4px">${t}</p>`;

    // Motivo / Motif — borde azul oscuro
    if (t.startsWith('📌')) return `<div style="background:rgba(27,58,75,0.06);border-left:3px solid #1B3A4B;padding:5px 11px;border-radius:0 6px 6px 0;margin:4px 0"><p style="font-size:13px;margin:0;color:#1B3A4B">${t}</p></div>`;

    // Para mejorar / Pour améliorer — borde azul claro
    if (t.startsWith('🔍')) return `<div style="background:#f0f9ff;border-left:3px solid #0ea5e9;padding:5px 11px;border-radius:0 6px 6px 0;margin:4px 0 2px"><p style="font-size:12px;font-style:italic;margin:0;color:#0369a1">${t}</p></div>`;

    // Rango de precio / Fourchette — destacado en dorado
    if (t.startsWith('💶')) return `<div style="background:rgba(201,169,110,0.13);padding:7px 13px;border-radius:7px;margin:6px 0"><p style="font-size:14px;font-weight:700;margin:0;color:#1B3A4B">${t}</p></div>`;

    // Fiabilidad / Fiabilité — código de color
    if (t.startsWith('🎯')) {
      const esAlta = t.includes('Alta') || t.includes('Haute');
      const esBaja = t.includes('Baja') || t.includes('Basse');
      const color  = esAlta ? '#166534' : esBaja ? '#991b1b' : '#92400e';
      const bg     = esAlta ? 'rgba(22,101,52,0.08)' : esBaja ? 'rgba(153,27,27,0.08)' : 'rgba(146,64,14,0.08)';
      return `<div style="background:${bg};border-radius:6px;padding:5px 10px;margin:4px 0;display:inline-block"><p style="font-size:13px;font-weight:600;color:${color};margin:0">${t}</p></div>`;
    }

    // Facilidad de venta / Facilité de vente
    if (t.startsWith('⭐')) return `<p style="font-size:13px;margin:3px 0;color:#92400e">${t}</p>`;

    // Tiempo de venta / Délai
    if (t.startsWith('⏱️')) return `<p style="font-size:13px;margin:3px 0;color:#555">${t}</p>`;

    // Mejor plataforma / Meilleure plateforme
    if (t.startsWith('🏪')) return `<p style="font-size:13px;margin:3px 0;color:#1B3A4B">${t}</p>`;

    // Consejo / Conseil — borde dorado izquierdo
    if (t.startsWith('💡')) return `<div style="background:#fffbf4;border-left:3px solid #C9A96E;padding:6px 11px;border-radius:0 6px 6px 0;margin:5px 0 2px"><p style="font-size:13px;font-style:italic;margin:0;color:#7a6540">${t}</p></div>`;

    // Ítems de poco valor (▸)
    if (t.startsWith('▸')) return `<p style="font-size:12px;margin:2px 0;color:#888;padding-left:8px">${t}</p>`;

    // RESUMEN — cabecera
    if (t.startsWith('📋')) return `<p style="font-size:16px;font-weight:700;margin:6px 0 10px;color:#1B3A4B;letter-spacing:0.3px">${t}</p>`;

    // RESUMEN — línea de conteo
    if (t.startsWith('Objetos analizados:') || t.startsWith('Objets analysés:')) return `<p style="font-size:13px;margin:3px 0;color:#555">${t}</p>`;

    // RESUMEN — potencial total
    if (t.startsWith('💰')) return `<div style="background:#1B3A4B;color:#F9F7F4;padding:10px 16px;border-radius:8px;margin:8px 0 5px"><p style="font-weight:700;font-size:15px;margin:0">${t}</p></div>`;

    // RESUMEN — los más interesantes / les plus intéressants
    if (t.startsWith('🏆')) return `<p style="font-size:14px;font-weight:600;margin:5px 0;color:#C9A96E">${t}</p>`;

    // RESUMEN — comentario final
    if (t.startsWith('💬')) return `<div style="background:rgba(201,169,110,0.08);border-radius:8px;padding:10px 14px;margin:8px 0 4px"><p style="font-size:13px;font-style:italic;margin:0;color:#555;line-height:1.6">${t}</p></div>`;

    return `<p style="margin:3px 0;font-size:13px;line-height:1.65;color:#2a2a2a">${t}</p>`;
  }).join('');
}

// ── Endpoint principal ────────────────────────────────────────────────────────

app.post('/api/contacto', async (req, res) => {
  const { nombre, nom, empresa, entreprise, email, sector, metier, volumen, volume, pais, pays, mensaje, message, idioma, langue } = req.body;
  const lang     = idioma || langue || 'es';
  const esFr     = lang === 'fr';
  const nombreFinal   = nombre || nom || '';
  const empresaFinal  = empresa || entreprise || '';
  if (!nombreFinal || !email) return res.status(400).json({ error: 'Faltan datos.' });

  const sectorFinal  = sector || metier || '';
  const volumenFinal = volumen || volume || '';
  const paisFinal    = pais || pays || '';
  const mensajeFinal = mensaje || message || '';

  const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#1B3A4B">
  <div style="background:#1B3A4B;padding:16px 24px;border-radius:8px 8px 0 0">
    <span style="font-size:20px;font-weight:700;color:#F9F7F4">Valor<span style="color:#C9A96E">IA</span> — ${esFr ? 'Demande Pro' : 'Solicitud Pro'}</span>
  </div>
  <div style="background:#F9F7F4;padding:20px 24px;border:1px solid #ebe6dc;border-top:none;border-radius:0 0 8px 8px">
    <p><strong>${esFr ? 'Nom' : 'Nombre'}:</strong> ${nombreFinal}</p>
    <p><strong>${esFr ? 'Entreprise' : 'Empresa'}:</strong> ${empresaFinal}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>${esFr ? 'Métier' : 'Sector'}:</strong> ${sectorFinal}</p>
    <p><strong>${esFr ? 'Volume/mois' : 'Volumen/mes'}:</strong> ${volumenFinal}</p>
    <p><strong>${esFr ? 'Pays' : 'País'}:</strong> ${paisFinal}</p>
    ${mensajeFinal ? `<p><strong>${esFr ? 'Message' : 'Mensaje'}:</strong> ${mensajeFinal}</p>` : ''}
  </div>
</div>`;

  try {
    await resend.emails.send({
      from:    'ValorIA <contact@valoriahome.fr>',
      to:      'contact.valoriahome@gmail.com',
      replyTo: email,
      subject: esFr ? `Demande Pro — ${nombreFinal} (${empresaFinal})` : `Solicitud Pro — ${nombreFinal} (${empresaFinal})`,
      html:    htmlBody
    });
    res.json({ exito: true });
  } catch (err) {
    console.error('Error Resend contacto:', err.message);
    res.status(500).json({ error: 'Error al enviar.' });
  }
});

app.post('/api/analizar', async (req, res) => {
  const { nombre, email: emailRaw, tipo, idioma, imagenes } = req.body;
  const email       = (emailRaw || '').toLowerCase().trim();
  const nombreFinal = (nombre || '').trim() || (email ? email.split('@')[0] : '');

  if (!email || !Array.isArray(imagenes) || imagenes.length === 0) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }
  if (imagenes.length > MAX_IMAGENES) {
    return res.status(400).json({ error: `Máximo ${MAX_IMAGENES} fotos en el plan gratuito.` });
  }

  // Verificar límite de uso
  const { data: uso } = await supabase
    .from('usos')
    .select('count')
    .eq('email', email)
    .single();

  const limiteAplicable = EMAILS_PRO_BETA.includes(email) ? LIMITE_PRO_BETA : LIMITE_GRATUITO;
  if (!EMAILS_EXENTOS.includes(email) && uso && uso.count >= limiteAplicable) {
    return res.status(403).json({
      limite: true,
      error: idioma === 'fr'
        ? 'Vous avez déjà utilisé votre analyse gratuite. Passez en Pro pour continuer.'
        : 'Ya has utilizado tu análisis gratuito. Pasa a Pro para continuar.'
    });
  }

  const esFr     = idioma === 'fr';
  const prompt   = esFr ? PROMPT_FR : PROMPT_ES;
  const userText = esFr
    ? `Bonjour, je suis ${nombreFinal} (compte: ${tipo || 'gratuit'}). Analyse ces ${imagenes.length} photo(s).`
    : `Hola, soy ${nombreFinal} (cuenta: ${tipo || 'gratuito'}). Analiza estas ${imagenes.length} foto(s).`;

  // ── Chequeo previo de calidad de fotos (gpt-4o-mini, ~0.01¢, no consume el análisis gratuito)
  try {
    const checkCalidad = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      max_tokens:  120,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: esFr
            ? 'Évalue si les images sont suffisamment claires pour identifier des objets domestiques. Réponds UNIQUEMENT avec du JSON valide, sans aucun commentaire : {"aptas":true} ou {"aptas":false,"motivo":"raison brève en français"}'
            : 'Evalúa si las imágenes son suficientemente claras para identificar objetos domésticos. Responde SOLO con JSON válido, sin ningún comentario adicional: {"aptas":true} o {"aptas":false,"motivo":"razón breve en español"}'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: esFr ? 'Ces images sont-elles assez claires pour identifier des objets et estimer leur valeur ?' : '¿Son estas imágenes suficientemente claras para identificar objetos y estimar su valor?' },
            ...imagenes.map(url => ({ type: 'image_url', image_url: { url, detail: 'low' } }))
          ]
        }
      ]
    });
    const raw = checkCalidad.choices[0].message.content.trim();
    const calidad = JSON.parse(raw);
    if (calidad.aptas === false) {
      const motivo = calidad.motivo ? ` ${calidad.motivo}.` : '';
      return res.status(422).json({
        fotosMalas: true,
        error: esFr
          ? `Vos photos ne sont pas assez claires pour l'analyse.${motivo} Votre analyse gratuite n'a pas été consommée — réessayez avec de meilleures photos.`
          : `Las fotos no son suficientemente claras para el análisis.${motivo} Tu análisis gratuito no ha sido consumido — puedes volver a intentarlo con mejores fotos.`
      });
    }
  } catch (err) {
    // Si el chequeo falla por cualquier razón, procedemos igualmente (fail-safe)
    console.warn('Chequeo calidad fotos falló, procediendo:', err.message);
  }

  // Plan gratuito: 2400 tokens · Pro/profesional: 4000 tokens (análisis más detallado)
  const esPro      = tipo === 'pro' || tipo === 'profesional';
  const maxTokens  = esPro ? 4000 : 2400;

  // Llamada a OpenAI
  let analisis;
  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o',
      max_tokens:  maxTokens,
      temperature: 0.2,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            ...imagenes.map(url => ({ type: 'image_url', image_url: { url, detail: 'auto' } }))
          ]
        }
      ]
    });
    analisis = completion.choices[0].message.content.trim();
    if (!analisis || analisis.length < 80) {
      return res.status(500).json({ error: esFr
        ? 'Analyse incomplète reçue. Réessayez avec des photos plus nettes.'
        : 'Análisis incompleto recibido. Inténtalo de nuevo con fotos más claras.' });
    }
  } catch (err) {
    console.error('Error OpenAI:', err.message);
    return res.status(500).json({ error: esFr
      ? 'Erreur lors de l\'analyse des images. Veuillez réessayer.'
      : 'Error al analizar las imágenes. Inténtalo de nuevo.'
    });
  }

  // Email
  const analisisHTML = formatearAnalisis(analisis);

  const emailHTML = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1B3A4B;background:#ffffff">

  <!-- Header -->
  <div style="background:#1B3A4B;padding:22px 28px;border-radius:8px 8px 0 0">
    <span style="font-size:22px;font-weight:700;color:#F9F7F4">Valor<span style="color:#C9A96E">IA</span></span>
  </div>

  <!-- Intro -->
  <div style="background:#F9F7F4;padding:22px 28px 8px">
    <p style="margin:0 0 6px;font-size:15px">${esFr ? 'Bonjour' : 'Hola'} <strong>${nombreFinal}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      ${esFr
        ? `Voici votre rapport d'analyse pour <strong>${imagenes.length} photo(s)</strong>.`
        : `Aquí tienes tu informe de análisis de <strong>${imagenes.length} foto(s)</strong>.`}
    </p>
  </div>

  <!-- Aviso orientativo -->
  <div style="background:#fffbf4;border-left:4px solid #C9A96E;padding:10px 16px;margin:0 28px;border-radius:0 6px 6px 0">
    <p style="font-size:12px;color:#7a6540;margin:0;line-height:1.6">
      <strong>⚠️ ${esFr ? 'Estimation indicative uniquement' : 'Valoración orientativa'}.</strong>
      ${esFr
        ? ' Les fourchettes de prix sont basées sur des données de marché visibles et ne constituent pas une expertise professionnelle. Les prix réels peuvent varier selon l\'état exact de l\'objet, la demande locale et les négociations avec l\'acheteur.'
        : ' Los rangos de precio se basan en datos de mercado visibles y no constituyen una tasación profesional. Los precios reales pueden variar según el estado exacto del objeto, la demanda local y la negociación con el comprador.'}
    </p>
  </div>

  <!-- Análisis -->
  <div style="background:#ffffff;padding:16px 28px 24px;border:1px solid #ebe6dc;border-top:none">
    ${analisisHTML}
  </div>

  <!-- Footer -->
  <div style="background:#F9F7F4;padding:16px 28px;border-radius:0 0 8px 8px;border:1px solid #ebe6dc;border-top:none">
    <p style="font-size:11px;color:#aaa;margin:0">
      ${esFr
        ? "Estimation indicative. Photos non conservées sur nos serveurs. L'équipe ValorIA — <a href='https://valoriahome.fr' style='color:#C9A96E'>valoriahome.fr</a>"
        : "Análisis orientativo. Imágenes no almacenadas en nuestros servidores. El equipo ValorIA — <a href='https://valoriahome.es' style='color:#C9A96E'>valoriahome.es</a>"}
    </p>
  </div>

</div>`;

  try {
    await resend.emails.send({
      from:    'ValorIA <contact@valoriahome.fr>',
      to:      email,
      subject: esFr
        ? `Votre rapport ValorIA — ${nombreFinal}`
        : `Tu informe ValorIA — ${nombreFinal}`,
      html: emailHTML
    });
  } catch (err) {
    console.error('Error Resend (email no enviado):', err.message);
    // El análisis se completó aunque el email falló — no consumir el análisis gratuito
    return res.status(500).json({ error: esFr
      ? 'Analyse effectuée mais erreur d\'envoi de l\'e-mail. Contactez-nous à contact@valoriahome.fr'
      : 'Análisis completado pero error al enviar el email. Escríbenos a contact@valoriahome.es'
    });
  }

  // Registrar uso SOLO después de que el email se haya enviado correctamente
  try {
    if (uso) {
      await supabase.from('usos').update({ count: uso.count + 1 }).eq('email', email);
    } else {
      await supabase.from('usos').insert({ email, count: 1 });
    }
  } catch (err) {
    console.error('Error Supabase registro uso:', err.message);
  }

  // Guardar miniatura en Supabase Storage
  let thumbnailUrl = null;
  try {
    const base64Data = imagenes[0].replace(/^data:image\/\w+;base64,/, '');
    const buffer     = Buffer.from(base64Data, 'base64');
    const filename   = `${Date.now()}_${email.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('thumbnails')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: false });
    if (!uploadError) {
      thumbnailUrl = supabaseAdmin.storage.from('thumbnails').getPublicUrl(filename).data.publicUrl;
      console.log('Miniatura guardada:', thumbnailUrl);
    } else {
      console.warn('Thumbnail error:', uploadError.message);
    }
  } catch (err) {
    console.warn('Thumbnail failed:', err.message);
  }

  // Guardar análisis para control de calidad
  try {
    const { error: insertError } = await supabaseAdmin.from('analisis').insert({
      email,
      nombre:         nombreFinal,
      idioma:         idioma || 'es',
      tipo:           tipo || 'gratuito',
      num_fotos:      imagenes.length,
      texto_analisis: analisis,
      thumbnail_url:  thumbnailUrl,
      email_enviado:  true
    });
    if (insertError) {
      console.error('Error insertar análisis:', JSON.stringify(insertError));
    } else {
      console.log('Análisis guardado correctamente');
    }
  } catch (err) {
    console.error('Error Supabase guardar análisis:', err.message);
  }

  res.json({ exito: true });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('ValorIA backend OK'));

app.listen(PORT, () => console.log(`ValorIA backend escuchando en puerto ${PORT}`));

// ── Keepalive Supabase ────────────────────────────────────────────────────────
// Supabase pausa proyectos gratuitos tras 7 días sin actividad.
// Este ping cada 23h mantiene el proyecto activo sin coste.
setInterval(async () => {
  try {
    await supabase.from('usos').select('count', { count: 'exact', head: true });
    console.log('[keepalive] Supabase OK —', new Date().toISOString());
  } catch (e) {
    console.warn('[keepalive] Supabase falló:', e.message);
  }
}, 23 * 60 * 60 * 1000);

// ── POST /api/waitlist ────────────────────────────────────────────────────────
// Guarda emails de lista de espera "Informe Plus" y envía notificación.
app.post('/api/waitlist', async (req, res) => {
  const { email: emailRaw, idioma } = req.body;
  const email = (emailRaw || '').toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }
  try {
    const { error } = await supabaseAdmin
      .from('waitlist')
      .upsert({ email, idioma: idioma || 'es' }, { onConflict: 'email', ignoreDuplicates: true });
    if (error) console.error('Waitlist insert error:', error.message);

    await resend.emails.send({
      from:    'ValorIA <contact@valoriahome.fr>',
      to:      'contact.valoriahome@gmail.com',
      subject: `[ValorIA] Nueva espera Informe Plus — ${email}`,
      html:    `<p>Nuevo email en lista de espera <strong>Informe Plus</strong>:<br><br>
                <strong>${email}</strong><br>
                Idioma: ${idioma || 'es'}<br>
                Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Paris' })}</p>`
    });
    res.json({ exito: true });
  } catch (err) {
    console.error('Error /api/waitlist:', err.message);
    res.status(500).json({ error: 'Error al registrar.' });
  }
});

// ── GET /admin/status ─────────────────────────────────────────────────────────
// Estado general del sistema para la Sala de Control de ValoriaQC.
// Requiere cabecera: x-admin-token: <ADMIN_TOKEN>
app.get('/admin/status', async (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const ahora    = new Date();
  const hoyIso   = ahora.toISOString().slice(0, 10);
  const mesStart = `${ahora.toISOString().slice(0, 7)}-01`;
  const startMs  = Date.now();

  try {
    const [
      totalAnalisis,
      analisisHoy,
      totalUsos,
      ultimoAnalisis,
      thumbnailsCount,
      emailsMes,
      emailsHoy,
      waitlistTotal,
      waitlistHoy
    ] = await Promise.all([
      supabaseAdmin.from('analisis').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('analisis').select('id', { count: 'exact', head: true })
        .gte('created_at', `${hoyIso}T00:00:00Z`),
      supabaseAdmin.from('usos').select('email', { count: 'exact', head: true }),
      supabaseAdmin.from('analisis').select('created_at')
        .order('created_at', { ascending: false }).limit(1),
      supabaseAdmin.from('analisis').select('id', { count: 'exact', head: true })
        .not('thumbnail_url', 'is', null),
      supabaseAdmin.from('analisis').select('id', { count: 'exact', head: true })
        .eq('email_enviado', true).gte('created_at', `${mesStart}T00:00:00Z`),
      supabaseAdmin.from('analisis').select('id', { count: 'exact', head: true })
        .eq('email_enviado', true).gte('created_at', `${hoyIso}T00:00:00Z`),
      supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true })
        .gte('created_at', `${hoyIso}T00:00:00Z`)
    ]);

    // Estimación coste OpenAI desde Supabase (API billing deprecada en cuentas pay-as-you-go)
    // Coste medio por análisis: ~$0.05 (gpt-4o 2-3 fotos detail:auto + gpt-4o-mini precheck)
    const COSTE_POR_ANALISIS = 0.05;
    const analisisMes = await supabaseAdmin
      .from('analisis')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${mesStart}T00:00:00Z`);
    const analisisMesCount = analisisMes.count ?? 0;
    const openaiGastoEstimado = parseFloat((analisisMesCount * COSTE_POR_ANALISIS).toFixed(2));

    res.json({
      timestamp: ahora.toISOString(),
      railway: {
        status:      'ok',
        responseMs:  Date.now() - startMs,
        uptimeHoras: Math.floor(process.uptime() / 3600)
      },
      supabase: {
        status:         totalAnalisis.error ? 'error' : 'ok',
        totalAnalisis:  totalAnalisis.count  ?? 0,
        analisisHoy:    analisisHoy.count    ?? 0,
        usuariosUnicos: totalUsos.count      ?? 0,
        ultimoAnalisis: ultimoAnalisis.data?.[0]?.created_at ?? null,
        thumbnails:     thumbnailsCount.count ?? 0
      },
      openai: {
        gastoMes:  openaiGastoEstimado,
        estimado:  true,
        analisesMes: analisisMesCount
      },
      resend: {
        emailsMes:     emailsMes.count ?? 0,
        emailsHoy:     emailsHoy.count ?? 0,
        limiteDiario:  100,
        limiteMensual: 3000
      },
      waitlist: {
        total:     waitlistTotal.count ?? 0,
        nuevosHoy: waitlistHoy.count   ?? 0
      }
    });
  } catch (err) {
    console.error('Error /admin/status:', err.message);
    res.status(500).json({ error: err.message });
  }
});
