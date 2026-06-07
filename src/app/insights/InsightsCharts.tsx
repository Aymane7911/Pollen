"use client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type Datum = { name: string; value: number };
type AirPoint = { date: string; pm25: number | null; pm10: number | null };

const GREEN = "#1f5d3a";
const AMBER = "#c98a2b";
const INFO = "#2c6e8f";
const PIE = ["#1f5d3a", "#2f7d76", "#2c6e8f", "#6c4f9c", "#c98a2b", "#b14a55", "#8a9b3a", "#163f28", "#a06a2c", "#4a7a8c"];
const axis = { fontSize: 11, fill: "#646f68" };

function Card({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="pa-card">
      <div className="pa-card-header"><div><span className="pa-card-eyebrow">{eyebrow}</span><h2>{title}</h2></div></div>
      <div className="pa-card-body" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </div>
  );
}

export default function InsightsCharts({
  recordsByMonth, byAperture, byShape, byStatus, byFamily, airSeries, grainsByMonth,
}: {
  recordsByMonth: Datum[];
  byAperture: Datum[];
  byShape: Datum[];
  byStatus: Datum[];
  byFamily: Datum[];
  airSeries: AirPoint[];
  grainsByMonth: Datum[];
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
      <Card eyebrow="Activity" title="Records by month">
        <BarChart data={recordsByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis dataKey="name" tick={axis} /><YAxis tick={axis} allowDecimals={false} />
          <Tooltip /><Bar dataKey="value" name="Records" fill={GREEN} radius={[4, 4, 0, 0]} />
        </BarChart>
      </Card>

      <Card eyebrow="Aerobiology" title="Air quality — PM2.5 / PM10 (30 days)">
        <LineChart data={airSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis dataKey="date" tick={axis} minTickGap={20} /><YAxis tick={axis} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="pm25" name="PM2.5" stroke={GREEN} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="pm10" name="PM10" stroke={AMBER} dot={false} strokeWidth={2} />
        </LineChart>
      </Card>

      <Card eyebrow="Morphology" title="Aperture pattern">
        <PieChart>
          <Pie data={byAperture} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
            {byAperture.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </Card>

      <Card eyebrow="Coverage" title="Top plant families">
        <BarChart data={byFamily} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis type="number" tick={axis} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={axis} width={110} />
          <Tooltip /><Bar dataKey="value" name="Species" fill={INFO} radius={[0, 4, 4, 0]} />
        </BarChart>
      </Card>

      <Card eyebrow="Aerobiology" title="Airborne grains by month">
        <BarChart data={grainsByMonth}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis dataKey="name" tick={axis} /><YAxis tick={axis} />
          <Tooltip /><Bar dataKey="value" name="Grains" fill={AMBER} radius={[4, 4, 0, 0]} />
        </BarChart>
      </Card>

      <Card eyebrow="Morphology" title="Grain shape">
        <BarChart data={byShape}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis dataKey="name" tick={axis} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis tick={axis} allowDecimals={false} />
          <Tooltip /><Bar dataKey="value" name="Types" fill={GREEN} radius={[4, 4, 0, 0]} />
        </BarChart>
      </Card>

      <Card eyebrow="Pipeline" title="Records by validation status">
        <BarChart data={byStatus}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1ec" />
          <XAxis dataKey="name" tick={axis} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis tick={axis} allowDecimals={false} />
          <Tooltip /><Bar dataKey="value" name="Records" fill={INFO} radius={[4, 4, 0, 0]} />
        </BarChart>
      </Card>
    </div>
  );
}
