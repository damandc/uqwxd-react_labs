// POST /castVote  { auraId, voterId, word }  ->  { ok, count }
// A friend casts an anonymous one-word vote. voter_id is stored but NEVER
// returned to anyone except a paying owner via revealVoter.
const { admin } = require('../lib/supabaseAdmin');

module.exports = async function handler(req, res) {
  try {
    const { auraId, voterId, word } = req.body || {};
    if (!auraId || !voterId || !word) {
      return res.status(400).json({ error: 'auraId, voterId, word required' });
    }
    // Keep it to a single word; trim the kinetic chaos.
    const clean = String(word).trim().split(/\s+/)[0].slice(0, 24);

    const { error } = await admin
      .from('votes')
      .insert({ aura_id: auraId, voter_id: voterId, word: clean });
    if (error) throw error;

    const { count } = await admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('aura_id', auraId);

    return res.status(200).json({ ok: true, count: count ?? 0 });
  } catch (e) {
    console.error('castVote', e);
    return res.status(500).json({ error: 'vote_failed' });
  }
};
