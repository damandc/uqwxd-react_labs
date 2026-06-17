// POST /revealVoter  { ownerId, voteId }  ->  { word, voter } | 402 paywall
// The cliffhanger payoff. Server-side entitlement check is the ONLY gate that
// lets voter identity cross the wire. No AURA+, no reveal — full stop.
const { admin } = require('../lib/supabaseAdmin');

module.exports = async function handler(req, res) {
  try {
    const { ownerId, voteId } = req.body || {};
    if (!ownerId || !voteId) {
      return res.status(400).json({ error: 'ownerId, voteId required' });
    }

    // 1. Verify the caller actually owns the aura this vote belongs to.
    const { data: vote, error: vErr } = await admin
      .from('votes')
      .select('id, word, voter_id, aura_id, auras!inner(owner_id)')
      .eq('id', voteId)
      .single();
    if (vErr || !vote) return res.status(404).json({ error: 'vote_not_found' });
    if (vote.auras.owner_id !== ownerId) {
      return res.status(403).json({ error: 'not_your_aura' });
    }

    // 2. Entitlement gate — this is the paywall. Computed server-side.
    const { data: ok } = await admin.rpc('has_active_aura_plus', { p_owner: ownerId });
    if (!ok) {
      return res.status(402).json({
        error: 'aura_plus_required',
        offer: { product: 'aura_plus_weekly', price: '$4.99/wk' },
      });
    }

    // 3. Entitled — resolve a display handle for the voter and reveal.
    const { data: voter } = await admin
      .from('auras')
      .select('verdict')
      .eq('owner_id', vote.voter_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.status(200).json({
      word: vote.word,
      voter: { id: vote.voter_id, lastAura: voter?.verdict ?? null },
    });
  } catch (e) {
    console.error('revealVoter', e);
    return res.status(500).json({ error: 'reveal_failed' });
  }
};
