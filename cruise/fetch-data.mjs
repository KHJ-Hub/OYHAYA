import fs from "node:fs";

const sourceUrl = process.env.CRUISE_API_URL?.trim();
if (!sourceUrl) {
  console.error("CRUISE_API_URL secret is missing.");
  console.error("Add the official data.go.kr request URL as a GitHub Actions secret named CRUISE_API_URL.");
  process.exit(1);
}

const url = new URL(sourceUrl);
if (!url.searchParams.has("numOfRows")) url.searchParams.set("numOfRows", "1000");
if (!url.searchParams.has("pageNo")) url.searchParams.set("pageNo", "1");
if (!url.searchParams.has("_type") && !url.searchParams.has("resultType")) {
  url.searchParams.set("_type", "json");
}

const res = await fetch(url, {
  headers: { "User-Agent": "OYHAYA-CruiseCalendar/1.0" }
});
if (!res.ok) throw new Error(`API HTTP ${res.status}`);

const text = await res.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  throw new Error("API did not return JSON. Check the request URL and JSON response option.");
}

function objectArrays(value, found = []) {
  if (Array.isArray(value)) {
    if (value.length && value.every(v => v && typeof v === "object" && !Array.isArray(v))) found.push(value);
    for (const v of value) objectArrays(v, found);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) objectArrays(v, found);
  }
  return found;
}

const arrays = objectArrays(payload);
if (!arrays.length) {
  const msg = JSON.stringify(payload).slice(0, 1200);
  throw new Error("No schedule item array found in API response: " + msg);
}
const rows = arrays.sort((a,b) => b.length - a.length)[0];

const normKey = k => String(k).toLowerCase().replace(/[_\-\s]/g, "");
const entries = obj => Object.entries(obj ?? {});
function pick(obj, aliases) {
  const wanted = aliases.map(normKey);
  for (const [k,v] of entries(obj)) {
    const nk = normKey(k);
    if (wanted.includes(nk)) return v;
  }
  for (const [k,v] of entries(obj)) {
    const nk = normKey(k);
    if (wanted.some(a => nk.includes(a) || a.includes(nk))) return v;
  }
  return "";
}
function firstDateLike(obj, rejectWords = []) {
  for (const [k,v] of entries(obj)) {
    const nk = normKey(k);
    if (rejectWords.some(w => nk.includes(normKey(w)))) continue;
    if (/\d{4}[-/.]?\d{2}[-/.]?\d{2}/.test(String(v ?? ""))) return v;
  }
  return "";
}
function isoDate(v) {
  const s = String(v ?? "").trim();
  let m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  m = s.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

const aliases = {
  ship: ["선박명","선명","shipNm","shipName","vsslNm","vesselNm","vesselName","cruiseNm"],
  arrival: ["입항예정일시","입항일시","arrivalDt","arrivalDate","arrivalTime","arrPlanDt","arvlPrarDt","etb","eta"],
  departure: ["출항예정일시","출항일시","departureDt","departureDate","departureTime","depPlanDt","dprtPrarDt","etd"],
  terminal: ["입항지","터미널","부두","선석","berth","berthNm","terminal","terminalNm","portNm"],
  passengers: ["승객정원","승객수","여객정원","passengerCapacity","passengers","pax","psngrCnt","psggrCapa"],
  previousPort: ["이전기항지","전항지","previousPort","prevPort","previousPortNm","prevPortNm"],
  nextPort: ["다음기항지","차항지","nextPort","nextPortNm"],
};

const out = rows.map((r, i) => {
  const arrival = pick(r, aliases.arrival) || firstDateLike(r, ["출항","departure","dprt","dep","etd"]);
  const departure = pick(r, aliases.departure);
  return {
    id: pick(r, ["id","seq","순번"]) || i + 1,
    date: isoDate(arrival),
    ship: String(pick(r, aliases.ship) || "선박명 미상").trim(),
    arrival: String(arrival ?? "").trim(),
    departure: String(departure ?? "").trim(),
    terminal: String(pick(r, aliases.terminal) ?? "").trim(),
    passengers: String(pick(r, aliases.passengers) ?? "").trim(),
    previousPort: String(pick(r, aliases.previousPort) ?? "").trim(),
    nextPort: String(pick(r, aliases.nextPort) ?? "").trim()
  };
}).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date));

if (!out.length) {
  console.error("Raw item keys:", Object.keys(rows[0] ?? {}));
  throw new Error("Schedule items were found, but arrival dates could not be normalized.");
}

out.sort((a,b) => a.date.localeCompare(b.date) || a.arrival.localeCompare(b.arrival) || a.ship.localeCompare(b.ship));

fs.writeFileSync("cruise/data.json", JSON.stringify(out, null, 2) + "\n");
console.log(`Saved ${out.length} cruise schedule rows.`);
