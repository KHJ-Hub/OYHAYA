import fs from "node:fs";
import { pathToFileURL } from "node:url";

const ENDPOINT = "https://apis.data.go.kr/6260000/CruiseBerthScheduleService/getCruiseBerthSchedule";

export function normalizeRow(row, index) {
  const arrival = String(row.ptentPrnmntDt ?? "").trim();
  const match = arrival.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/) || arrival.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) throw new Error(`Invalid arrival date in schedule row ${index + 1}; existing data preserved.`);
  const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid arrival date in schedule row ${index + 1}; existing data preserved.`);
  }
  const value = key => String(row[key] ?? "").trim();
  if (!value("vslNm")) throw new Error(`Missing vessel name in schedule row ${index + 1}.`);
  return {
    id: index + 1, date, ship: value("vslNm"), arrival,
    departure: value("dfptPrnmntDt"), terminal: value("poent"),
    passengers: value("psngPscp"), previousPort: value("bfrPrt"), nextPort: value("nextPrt"),
    dataDate: value("dataCrtrYmd")
  };
}

export async function fetchSchedules(key, fetcher = fetch) {
  if (!key?.trim()) throw new Error("Missing GitHub Actions secret: CRUISE_SERVICE_KEY");
  // Accept either the original key or the portal's percent-encoded copy.
  let decoded;
  try { decoded = decodeURIComponent(key.trim()); }
  catch { throw new Error("Invalid service-key encoding."); }
  const rows = [];
  let expectedTotal;
  for (let page = 1; page <= 100; page++) {
    const url = new URL(ENDPOINT);
    url.search = new URLSearchParams({ serviceKey: decoded, resultType: "json", numOfRows: "100", pageNo: String(page) });
    let response;
    try {
      response = await fetcher(url, { signal: AbortSignal.timeout(30000) });
    } catch {
      throw new Error("Official API connection failed or timed out; existing data preserved.");
    }
    let payload;
    try { payload = JSON.parse(await response.text()); }
    catch { throw new Error(`Official API returned non-JSON (HTTP ${response.status}); existing data preserved.`); }
    const gateway = payload.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const result = payload.response ?? payload;
    const header = result.header;
    const code = String(gateway?.returnReasonCode ?? header?.resultCode ?? "");
    // Do not print response bodies, request URLs, or errors that may echo the key.
    if (gateway || (header && !["0", "00", "0000"].includes(code))) {
      const safeCode = /^[\w-]{1,30}$/.test(code) ? code : "unknown";
      throw new Error(`Official API error code ${safeCode} (HTTP ${response.status}); existing data preserved.`);
    }
    if (!response.ok) throw new Error(`Official API HTTP ${response.status}; existing data preserved.`);
    const body = result.body;
    if (!body || !header) throw new Error("Unrecognized official API response; existing data preserved.");
    const total = Number(body.totalCount);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error("Invalid API totalCount.");
    expectedTotal ??= total;
    if (total !== expectedTotal) throw new Error("API changed during pagination; retry on the next run.");
    const items = body.items?.item ?? (Array.isArray(body.items) ? body.items : null);
    const batch = items == null || items === "" ? [] : Array.isArray(items) ? items : [items];
    if (!batch.every(item => item && typeof item === "object" && !Array.isArray(item))) throw new Error("Invalid schedule items.");
    rows.push(...batch);
    if (rows.length === total) {
      // A new empty result must not silently erase a previously populated calendar.
      if (!rows.length) throw new Error("Official API returned zero schedules; existing data preserved.");
      return rows.map(normalizeRow).sort((a, b) => a.date.localeCompare(b.date) || a.arrival.localeCompare(b.arrival) || a.ship.localeCompare(b.ship));
    }
    if (!batch.length || rows.length > total) throw new Error("Incomplete API pagination; existing data preserved.");
  }
  throw new Error("API pagination limit exceeded; existing data preserved.");
}

async function main() {
  const rows = await fetchSchedules(process.env.CRUISE_SERVICE_KEY);
  const target = new URL("./data.json", import.meta.url);
  const temporary = new URL("./data.json.tmp", import.meta.url);
  fs.writeFileSync(temporary, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(temporary, target);
  console.log(`Saved ${rows.length} official cruise schedule rows (${rows[0].date} to ${rows.at(-1).date}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
