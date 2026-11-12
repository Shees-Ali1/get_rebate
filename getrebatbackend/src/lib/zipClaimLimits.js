/** Max ZIP codes an agent or loan officer may hold at once. */
export const MAX_CLAIMED_ZIPS = 6;

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "paid"]);

function normalizeZip(value) {
  return String(value || "").trim();
}

/**
 * Unique ZIP slots already occupied by claimedZipCodes and/or active subscriptions.
 * Billing can show a ZIP before claimedZipCodes is updated (and vice versa).
 */
export function getOccupiedZipSet(user) {
  const occupied = new Set();
  for (const z of user?.claimedZipCodes || []) {
    const code = normalizeZip(z.postalCode || z.zipCode || z.zipcode);
    if (code) occupied.add(code);
  }
  for (const s of user?.subscriptions || []) {
    const status = String(s?.subscriptionStatus || "").toLowerCase();
    if (!ACTIVE_SUB_STATUSES.has(status)) continue;
    const code = normalizeZip(s.zipcode || s.zipCode || s.postalCode);
    if (code) occupied.add(code);
  }
  return occupied;
}

export function countOccupiedZipSlots(user) {
  return getOccupiedZipSet(user).size;
}

export function canClaimAnotherZip(user, zipcode) {
  const occupied = getOccupiedZipSet(user);
  const code = normalizeZip(zipcode);
  if (code && occupied.has(code)) {
    return { ok: false, reason: "already_claimed", occupied: occupied.size };
  }
  if (occupied.size >= MAX_CLAIMED_ZIPS) {
    return { ok: false, reason: "at_cap", occupied: occupied.size };
  }
  return { ok: true, occupied: occupied.size };
}
