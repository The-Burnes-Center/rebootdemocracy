// ------

// const index     = client.initIndex(indexName);


// -----------------------------------------------------------------------------
// Algolia back-fill: add `date_at_epoch` to every record in an index
// Style adapted based on provided example.
// -----------------------------------------------------------------------------
// • Run once to migrate existing records.
// • Requires Node ≥18. Save as e.g., `migrate.mjs` and run with `node migrate.mjs`
//   (or save as .js and ensure "type": "module" in package.json).
// -----------------------------------------------------------------------------

import { algoliasearch } from 'algoliasearch';
import { TextEncoder, TextDecoder } from 'util';

// Worker / AWS polyfills
global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;



// -----------------------------------------------------------------------------
// ▶ Configuration from Environment variables
// -----------------------------------------------------------------------------

const ALGOLIA_APP_ID = "C07FHZRHNK";
const ALGOLIA_ADMIN_API_KEY = "d05bbed7f3de2e5edab543b26b08a0da";
const ALGOLIA_INDEX_NAME = "reboot_democracy_weekly_news"; // Index to migrate

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
//  DST helpers  (all arithmetic done in UTC to avoid host-TZ surprises)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns true iff the given UTC date/time falls inside U.S. Eastern DST
 * (second Sunday in March 02:00 ET → first Sunday in November 02:00 ET).
 * @param {Date} dUTC  -- A Date constructed with UTC methods.
 */
function isEasternDST(dUTC) {
  const y = dUTC.getUTCFullYear();

  // second Sunday in March @ 02:00 ET → 07:00 UTC (still on EST)
  const march1 = new Date(Date.UTC(y, 2, 1));
  const secondSundayMarch = 1 + ((7 - march1.getUTCDay()) % 7) + 7;
  const dstStartUTC = Date.UTC(y, 2, secondSundayMarch, 7);

  // first Sunday in November @ 02:00 ET → 06:00 UTC (already on EDT)
  const nov1 = new Date(Date.UTC(y, 10, 1));
  const firstSundayNov = 1 + ((7 - nov1.getUTCDay()) % 7);
  const dstEndUTC = Date.UTC(y, 10, firstSundayNov, 6);

  const t = dUTC.getTime();
  return t >= dstStartUTC && t < dstEndUTC;
}

/**
 * Convert an ISO-8601 string (assumed to be local Eastern *wall time*)
 * into a Unix-seconds epoch.
 * @returns {number|null}  whole seconds, or null on parse error
 */
function isoToEpoch(iso) {
  if (typeof iso !== 'string' || !iso.trim()) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;

  const [ , YY, MM, DD, hh, mm, ss = '0' ] = m;
  // Build a UTC date that *pretends* the text was UTC
  const utcMillis = Date.UTC(+YY, +MM - 1, +DD, +hh, +mm, +ss);
  const offsetHours = isEasternDST(new Date(utcMillis)) ? 4 : 5;  // EDT or EST
  return Math.floor(utcMillis / 1000) + offsetHours * 3600;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Migration loop  (Algolia JavaScript client v5)
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`▶ Starting back-fill on “${ALGOLIA_INDEX_NAME}”…`);

  let processed = 0, updated = 0, skippedNone = 0, skippedBad = 0;
  const BATCH_SIZE = 1_000;
  const buf = [];

  await client.browseObjects({
    indexName: ALGOLIA_INDEX_NAME,
    aggregator: (resp) => {
      const hits = resp.hits ?? []; processed += hits.length;

      for (const hit of hits) {
        const raw = hit.date;
        if (raw) {
          const epoch = isoToEpoch(raw);
          if (epoch !== null)
            buf.push({ objectID: hit.objectID, date_at_epoch: epoch });
          else skippedBad++;
        } else {
          skippedNone++;
        }
        if (buf.length >= BATCH_SIZE) flush();
      }
    }
  });
  await flush();

  console.log(`✔ Done.
    Processed         : ${processed}
    Updated           : ${updated}
    Skipped – no date : ${skippedNone}
    Skipped – bad date: ${skippedBad}`);

  async function flush() {
    if (!buf.length) return;
    const batch = buf.splice(0, buf.length);

    await client.partialUpdateObjects({          // Algolia v5 signature
      indexName: ALGOLIA_INDEX_NAME,
      objects: batch,
      createIfNotExists: false
    });
    updated += batch.length;
  }
})();