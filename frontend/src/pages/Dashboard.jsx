import React, { useEffect, useMemo, useState } from "react";

const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"];

function KPI({ title, value, suffix = "" }) {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">
        {value}
        {suffix && <span className="kpi-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function formatNumber(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString();
}

export default function Dashboard() {
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState("");

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const vehicleTypes = useMemo(() => {
    // We keep this static since the task doesn’t ask for a vehicle-type lookup endpoint.
    // If your vehicles have arbitrary types, consider adding a GET /api/vehicles/types.
    return [""];
  }, []);

  async function fetchSummary() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (vehicleType) params.set("vehicleType", vehicleType);
      if (vehicleStatus) params.set("vehicleStatus", vehicleStatus);

      const res = await fetch(`/api/dashboard/summary?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setSummary(null);
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Refetch on filter changes
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, vehicleStatus]);

  const cards = [
    {
      title: "Active Vehicles",
      value: summary ? formatNumber(summary.activeVehicles) : "0",
    },
    {
      title: "Available Vehicles",
      value: summary ? formatNumber(summary.availableVehicles) : "0",
    },
    {
      title: "Vehicles in Maintenance",
      value: summary ? formatNumber(summary.vehiclesInMaintenance) : "0",
    },
    {
      title: "Active Trips",
      value: summary ? formatNumber(summary.activeTrips) : "0",
    },
    {
      title: "Pending Trips",
      value: summary ? formatNumber(summary.pendingTrips) : "0",
    },
    {
      title: "Drivers On Duty",
      value: summary ? formatNumber(summary.driversOnDuty) : "0",
    },
    {
      title: "Fleet Utilization %",
      value: summary ? formatNumber(summary.fleetUtilizationPercent) : "0",
      suffix: "%",
    },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="dashboard-filters">
        <div className="filter-field">
          <label htmlFor="vehicleType">Vehicle Type</label>
          <select
            id="vehicleType"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="">All types</option>
            {/* Static placeholder; adapt if you add a types endpoint */}
            {vehicleTypes
              .filter((t) => t)
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="vehicleStatus">Vehicle Status</label>
          <select
            id="vehicleStatus"
            value={vehicleStatus}
            onChange={(e) => setVehicleStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="dashboard-status">Loading...</div>}
      {error && <div className="dashboard-error">{error}</div>}

      <div className="kpi-grid" style={{ opacity: loading ? 0.6 : 1 }}>
        {cards.map((c) => (
          <KPI
            key={c.title}
            title={c.title}
            value={c.value}
            suffix={c.suffix || ""}
          />
        ))}
      </div>
    </div>
  );
}
