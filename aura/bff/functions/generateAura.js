// POST /generateAura  { ownerId, seed }  ->  { id, verdict, gradient, vibe }
// Mints a new aura card. The AI call happens here, behind the key boundary.
const { generateAura } = require('../lib/anthropic');
const { admin } = require('../lib/supabaseAdmin');

module.exports = async function handler(req, res) {
  try {
    const { ownerId, seed } = req.body || {};
    if (!ownerId) return res.status(400).json({ error: 'ownerId required' });

    // TODO: per-device rate limit here (e.g. token bucket in Redis/Upstash)
    // before spending a model call — abuse guard for the public endpoint.

    const aura = await generateAura(seed || 'mystery energy');

    const { data, error } = await admin
      .from('auras')
      .insert({
        owner_id: ownerId,
        verdict: aura.verdict,
        gradient: aura.gradient,
        vibe: aura.vibe,
      })
      .select('id, verdict, gradient, vibe')
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (e) {
    console.error('generateAura', e);
    return res.status(500).json({ error: 'aura_generation_failed' });
  }
};
