"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";

type Lookup = { id: number; name: string };

const statusColors: Record<string, string> = {
  Draft: "#5a6268", Submitted: "#1d4a7a", UnderReview: "#8a5a06",
  Validated: "#1f5d3a", Rejected: "#8c2832", Published: "#163f28",
};
const statusBadge = (s: string) =>
  `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;background:${statusColors[s] || "#666"};color:#fff;font-weight:500">${s}</span>`;
const tag = (t: string, bg: string) =>
  `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;background:${bg};color:#fff;font-weight:500;margin-right:4px">${t}</span>`;

export default function MapClient() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const LRef = useRef<typeof LType | null>(null);
  const layers = useRef<Record<string, LType.LayerGroup>>({});
  const icons = useRef<Record<string, LType.DivIcon>>({});
  const riskLoaded = useRef(false);
  const alertsLoaded = useRef(false);

  const [ready, setReady] = useState(false);
  const [lookups, setLookups] = useState<{ regions: Lookup[]; types: Lookup[] }>({ regions: [], types: [] });
  const [audience, setAudience] = useState("");
  const [regionId, setRegionId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [year, setYear] = useState("");
  const [showRisk, setShowRisk] = useState(false);
  const [showTraps, setShowTraps] = useState(true);
  const [showBeehives, setShowBeehives] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [trapCount, setTrapCount] = useState(0);

  // Init Leaflet (browser only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current, { zoomControl: true }).setView([24.45, 54.38], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap", maxZoom: 18,
      }).addTo(map);
      layers.current = {
        record: L.layerGroup().addTo(map),
        trap: L.layerGroup().addTo(map),
        risk: L.layerGroup(),
        beehive: L.layerGroup(),
        alert: L.layerGroup(),
      };
      icons.current = {
        trap: L.divIcon({ html: '<div style="background:#6c4f9c;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:11px"><i class="bi bi-broadcast-pin"></i></div>', className: "", iconSize: [24, 24], iconAnchor: [12, 12] }),
        beehive: L.divIcon({ html: '<div style="background:#7a5b13;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);font-size:11px"><i class="bi bi-hexagon-fill"></i></div>', className: "", iconSize: [24, 24], iconAnchor: [12, 12] }),
      };
      mapRef.current = map;
      fetch("/api/map/lookups").then((r) => r.json()).then(setLookups).catch(() => {});
      setReady(true);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Records layer (re-loads on filter change).
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current!, g = layers.current.record;
    const p = new URLSearchParams();
    if (regionId) p.set("regionId", regionId);
    if (typeId) p.set("pollenTypeId", typeId);
    if (year) p.set("year", year);
    if (audience) p.set("forage", audience);
    fetch(`/api/map/records?${p}`).then((r) => r.json()).then((rows: Record<string, unknown>[]) => {
      g.clearLayers();
      for (const p2 of rows as Array<{ lat: number; lng: number; code: string; name: string; species: string; region: string; collectedOn: string; status: string; beeForage: boolean; cultivationTarget: boolean; id: number }>) {
        const m = L.circleMarker([p2.lat, p2.lng], { radius: 7, color: "#163f28", fillColor: "#1f5d3a", fillOpacity: 0.85, weight: 1.5 });
        let tags = "";
        if (p2.beeForage) tags += tag("Bee forage", "#7a5b13");
        if (p2.cultivationTarget) tags += tag("Cultivation", "#1d4a7a");
        m.bindPopup(`<strong style="font-size:.95rem">${p2.code}</strong><br><span style="font-weight:500">${p2.name}</span><br><em style="color:#6b7770">${p2.species || ""}</em><br><span style="color:#6b7770;font-size:.78rem">${p2.region || ""} · ${p2.collectedOn}</span>${tags ? `<div style="margin-top:6px">${tags}</div>` : ""}<div style="margin-top:6px">${statusBadge(p2.status)}</div>`);
        g.addLayer(m);
      }
      setRecordCount(rows.length);
    }).catch(() => {});
  }, [ready, regionId, typeId, year, audience]);

  // Traps (load once, toggle visibility).
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current!, g = layers.current.trap;
    if (g.getLayers().length === 0) {
      fetch("/api/map/traps").then((r) => r.json()).then((rows: Array<{ lat: number; lng: number; serial: string; model: string; region: string; location: string; status: string }>) => {
        for (const t of rows) {
          const m = L.marker([t.lat, t.lng], { icon: icons.current.trap });
          m.bindPopup(`<strong>Trap ${t.serial}</strong><br>${t.model || ""}<br><span style="color:#6b7770;font-size:.78rem">${t.region || ""} · ${t.location || ""}</span><div style="margin-top:6px"><span class="pa-pill">${t.status}</span></div>`);
          g.addLayer(m);
        }
        setTrapCount(rows.length);
      }).catch(() => {});
    }
    if (showTraps) mapRef.current!.addLayer(g); else mapRef.current!.removeLayer(g);
  }, [ready, showTraps]);

  // Risk layer (lazy-load, toggle).
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current!, map = mapRef.current!, g = layers.current.risk;
    if (showRisk) {
      if (!riskLoaded.current) {
        riskLoaded.current = true;
        fetch("/api/map/risk").then((r) => r.json()).then((rows: Array<{ latitude: number; longitude: number; regionName: string; level: string; colorBg: string; score: number; activeTaxa: number; note: string; topPollen: string[]; pm25: number | null; pm10: number | null; dustEvent: boolean }>) => {
          for (const p of rows) {
            if (p.latitude == null || p.longitude == null) continue;
            const c = L.circleMarker([p.latitude, p.longitude], { radius: 16, color: "#fff", weight: 2, fillColor: p.colorBg, fillOpacity: 0.78 });
            const air = (p.pm25 != null || p.pm10 != null || p.dustEvent)
              ? `<div style="color:#6b7770;font-size:.78rem;margin-top:4px">${p.pm25 != null ? "PM2.5 " + p.pm25.toFixed(0) : ""}${p.pm10 != null ? " · PM10 " + p.pm10.toFixed(0) : ""}${p.dustEvent ? " · ⚠ dust event" : ""}</div>`
              : "";
            const top = p.topPollen?.length ? `<div style="color:#6b7770;font-size:.78rem;margin-top:4px">${p.topPollen.join(", ")}</div>` : "";
            c.bindPopup(`<strong style="font-size:.95rem">${p.regionName}</strong> ${tag(p.level, p.colorBg)}<div style="font-size:.8rem;margin-top:4px">Risk score <strong>${p.score}</strong> · ${p.activeTaxa} active taxa</div><div style="color:#6b7770;font-size:.78rem">${p.note || ""}</div>${top}${air}`);
            g.addLayer(c);
          }
        }).catch(() => {});
      }
      map.addLayer(g);
    } else map.removeLayer(g);
  }, [ready, showRisk]);

  // Alert plume layer (§9 wind-directional affected areas; lazy-load, toggle).
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current!, map = mapRef.current!, g = layers.current.alert;
    if (showAlerts) {
      if (!alertsLoaded.current) {
        alertsLoaded.current = true;
        fetch("/api/map/alerts").then((r) => r.json()).then((rows: Array<{ id: number; region: string; level: string; score: number; colorBg: string; summary: string; recommendedActions: string | null; bearingDeg: number | null; radiusKm: number | null; recipientCount: number; polygon: [number, number][] }>) => {
          for (const a of rows) {
            if (!a.polygon?.length) continue;
            const poly = L.polygon(a.polygon, { color: a.colorBg, weight: 2, fillColor: a.colorBg, fillOpacity: 0.22 });
            const dir = a.bearingDeg != null
              ? `~${a.radiusKm?.toFixed(0)} km downwind (bearing ${a.bearingDeg.toFixed(0)}°)`
              : `~${a.radiusKm?.toFixed(0)} km (omnidirectional — no wind)`;
            poly.bindPopup(`<strong style="font-size:.95rem">${a.region}</strong> ${tag(a.level, a.colorBg)}<div style="font-size:.8rem;margin-top:4px">Alert score <strong>${a.score}</strong></div><div style="color:#42504a;font-size:.78rem;margin-top:4px">${a.summary}</div><div style="color:#6b7770;font-size:.78rem;margin-top:4px"><strong>Affected area:</strong> ${dir}</div>${a.recommendedActions ? `<div style="font-size:.78rem;margin-top:6px"><strong>Recommended:</strong> ${a.recommendedActions}</div>` : ""}<div style="color:#6b7770;font-size:.72rem;margin-top:6px"><i class="bi bi-send"></i> ${a.recipientCount} recipient(s) notified</div>`);
            g.addLayer(poly);
          }
        }).catch(() => {});
      }
      map.addLayer(g);
    } else map.removeLayer(g);
  }, [ready, showAlerts]);

  // Beehives (lazy-load, toggle).
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current!, map = mapRef.current!, g = layers.current.beehive;
    if (g.getLayers().length === 0) {
      fetch("/api/map/beehives").then((r) => r.json()).then((rows: Array<{ lat: number; lng: number; name: string; owner: string; region: string; colonies: number | null; active: boolean; lastMoved: string | null; id: number }>) => {
        for (const b of rows) {
          const m = L.marker([b.lat, b.lng], { icon: icons.current.beehive, opacity: b.active ? 1 : 0.55 });
          m.bindPopup(`<strong>${b.name}</strong>${b.active ? "" : " " + tag("Inactive", "#8a8f8b")}<br><span style="font-weight:500">${b.owner || ""}</span><br><span style="color:#6b7770;font-size:.78rem">${b.region || ""}${b.colonies != null ? " · " + b.colonies + " colonies" : ""}</span>${b.lastMoved ? `<br><span style="color:#6b7770;font-size:.78rem">Last moved ${b.lastMoved}</span>` : ""}<div style="margin-top:8px"><a href="/beehives/${b.id}" style="color:#1f5d3a;font-weight:500">Open apiary →</a></div>`);
          g.addLayer(m);
        }
      }).catch(() => {});
    }
    if (showBeehives) map.addLayer(g); else map.removeLayer(g);
  }, [ready, showBeehives]);

  const reset = () => { setAudience(""); setRegionId(""); setTypeId(""); setYear(""); };

  return (
    <div className="mx-auto max-w-7xl px-4 pa-content">
      {/* How to use + marker legend */}
      <div className="pa-card" style={{ padding: "1rem 1.15rem", marginBottom: "1rem", borderLeft: "3px solid var(--pa-primary)" }}>
        <div className="flex items-start gap-3">
          <i className="bi bi-info-circle" style={{ color: "var(--pa-primary)", fontSize: "1.2rem", marginTop: ".1rem" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-sm" style={{ color: "var(--pa-ink-soft)", lineHeight: 1.6 }}>
              <strong>How to use this map.</strong> Turn <strong>layers</strong> on and off with the checkboxes below,
              narrow the view with the <strong>audience</strong> (vegetation · beekeeper · pharma), region, pollen-type and
              year filters, then <strong>click any marker</strong> for its details. Switch on <strong>Risk index</strong>{" "}to
              see each region&apos;s combined pollen + air-quality risk, or <strong>Alert plumes</strong> for the downwind
              area of any live high-risk alert.
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "var(--pa-mute)" }}>
              <span className="flex items-center gap-1"><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#1f5d3a", border: "1.5px solid #163f28", display: "inline-block" }} /> Pollen record</span>
              <span className="flex items-center gap-1"><i className="bi bi-broadcast-pin" style={{ color: "#6c4f9c" }} /> Trap device</span>
              <span className="flex items-center gap-1"><i className="bi bi-hexagon-fill" style={{ color: "#7a5b13" }} /> Apiary</span>
              <span className="flex items-center gap-1"><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#c98a2b", border: "2px solid #fff", boxShadow: "0 0 0 1px var(--pa-line)", display: "inline-block" }} /> Regional risk</span>
              <span className="flex items-center gap-1"><span style={{ width: 15, height: 10, background: "rgba(179,38,30,.22)", border: "1px solid #b3261e", display: "inline-block" }} /> Alert plume (downwind)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pa-card" style={{ padding: ".85rem", marginBottom: "1rem" }}>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-mute">Audience
            <select className="block mt-1 border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--pa-line)", minWidth: 230 }} value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="">Vegetation — all pollen</option>
              <option value="bee">Beekeeper — bee forage</option>
              <option value="cultivation">Pharma — cultivation targets</option>
            </select>
          </label>
          <label className="text-xs text-mute">Region
            <select className="block mt-1 border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--pa-line)", minWidth: 130 }} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">All</option>
              {lookups.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-mute">Pollen type
            <select className="block mt-1 border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--pa-line)", minWidth: 200 }} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">All</option>
              {lookups.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-mute">Year
            <input type="number" min={1900} max={2100} placeholder="Any" className="block mt-1 border rounded px-2 py-1 text-sm" style={{ borderColor: "var(--pa-line)", width: 90 }} value={year} onChange={(e) => setYear(e.target.value)} />
          </label>
          <button className="pa-btn pa-btn-outline" onClick={reset}><i className="bi bi-arrow-counterclockwise" /> Reset</button>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--pa-line)" }}>
          <span className="text-xs text-mute">Layers</span>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showRisk} onChange={(e) => setShowRisk(e.target.checked)} /> Risk index</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showTraps} onChange={(e) => setShowTraps(e.target.checked)} /> Traps</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showBeehives} onChange={(e) => setShowBeehives(e.target.checked)} /> Beehives</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showAlerts} onChange={(e) => setShowAlerts(e.target.checked)} /> Alert plumes</label>
          <span className="ml-auto flex items-center gap-2">
            <span className="pa-pill"><i className="bi bi-circle-fill" /> {recordCount} records</span>
            <span className="pa-pill pa-pill-info"><i className="bi bi-broadcast-pin" /> {trapCount} traps</span>
          </span>
        </div>
        {showRisk && (
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-mute">
            <span>Risk:</span>
            <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#1f5d3a", display: "inline-block" }} /> Low</span>
            <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#c98a2b", display: "inline-block" }} /> Moderate</span>
            <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#d9730d", display: "inline-block" }} /> High</span>
            <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#b3261e", display: "inline-block" }} /> Very high</span>
          </div>
        )}
      </div>
      <div ref={mapEl} style={{ height: "70vh", borderRadius: "var(--pa-radius)", border: "1px solid var(--pa-line)", overflow: "hidden" }} />
      <p className="text-xs text-mute mt-3" style={{ lineHeight: 1.6 }}>
        <i className="bi bi-database" /> <strong>Sources:</strong>{" "}pollen records &amp; trap and apiary locations from
        field collection in the UAE Pollen Atlas (published records only); air quality in the risk layer from the
        <strong> UAE National Center of Meteorology (NCM)</strong> &amp; <strong>Environment Agency – Abu Dhabi (EAD)</strong>;
        basemap © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pa-primary)" }}>OpenStreetMap</a> contributors.
        The regional risk index and alert plumes are computed live by the Atlas from allergenic pollen in season combined with the
        latest air quality and wind. Locations are accurate; readings are illustrative.
      </p>
    </div>
  );
}
