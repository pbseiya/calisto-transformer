import { NextResponse } from "next/server";

const ANOMALY_API = process.env.ANOMALY_API_URL || "http://localhost:8000";
const H2_DANGER = 500;
const CO_DANGER = 1500;

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    // 1. Get device list from Next.js API
    const devicesRes = await fetchJson("http://localhost:3001/dga/api/devices");
    const devices: string[] = (devicesRes.devices || []).map((d: any) => d.name);

    // 2. Get current readings via Next.js API (it has DB access)
    const readingsRes = await fetchJson(
      `http://localhost:3001/dga/api/readings/now?devices=${devices.join(",")}`
    );
    const readings: any[] = readingsRes.data || [];

    // 3. Check thresholds
    const thresholdWarnings: Array<{ device: string; h2: number; co: number }> = [];
    for (const row of readings) {
      const h2 = row.h2 ?? row.h2_mean ?? 0;
      const co = row.co ?? row.co_mean ?? 0;
      if (h2 > H2_DANGER || co > CO_DANGER) {
        thresholdWarnings.push({ device: row.device_name, h2, co });
      }
    }

    // 4. Get statistical anomalies from Anomaly API
    const anomalies: any[] = [];
    for (const device of devices) {
      try {
        const a = await fetchJson(`${ANOMALY_API}/anomaly?device=${device}&hours=24`);
        if (a?.is_anomaly) {
          anomalies.push({
            device,
            severity: a.severity || "low",
            details: a.details || {},
            recommendations: a.recommendations || [],
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      thresholdWarnings,
      anomalies,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("anomaly-check error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
