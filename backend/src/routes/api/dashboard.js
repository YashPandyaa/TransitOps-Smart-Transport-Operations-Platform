import { Router } from "express";

import { pool } from "../../config/db.js";

const router = Router();

function normalizeVehicleType(v) {
  if (!v) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

function normalizeVehicleStatus(v) {
  if (!v) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}

// GET /api/dashboard/summary
// Optional query params:
// - vehicleType: filter vehicle-based metrics by vehicles.type
// - vehicleStatus: filter vehicle-based metrics by vehicles.status
router.get("/summary", async (req, res, next) => {
  try {
    const vehicleType = normalizeVehicleType(req.query.vehicleType);
    const vehicleStatus = normalizeVehicleStatus(req.query.vehicleStatus);

    // Filters from query params.
    // Applied to ALL KPIs that depend on vehicles (active/available/maintenance, trips, utilization denominator/numerator).
    const where = [];
    const params = [];

    if (vehicleType) {
      params.push(vehicleType);
      where.push(`v.type = $${params.length}`);
    }
    if (vehicleStatus) {
      params.push(vehicleStatus);
      where.push(`v.status = $${params.length}`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const q = await pool.query(
      `WITH filtered_vehicles AS (
         SELECT v.*
         FROM vehicles v
         ${whereSQL}
       )
       SELECT
         -- Vehicle KPIs
         (SELECT COUNT(*) FROM filtered_vehicles v WHERE v.status <> 'Retired') AS active_vehicles,
         (SELECT COUNT(*) FROM filtered_vehicles v WHERE v.status = 'Available') AS available_vehicles,
         (SELECT COUNT(*) FROM filtered_vehicles v WHERE v.status = 'In Shop') AS in_maintenance_vehicles,

         -- Fleet Utilization % = (vehicles with status On Trip / total non-Retired vehicles) * 100
         (SELECT COALESCE(COUNT(*), 0) FROM filtered_vehicles v WHERE v.status = 'On Trip') AS on_trip_vehicles,
         (SELECT COALESCE(COUNT(*), 0) FROM filtered_vehicles v WHERE v.status <> 'Retired') AS total_non_retired_vehicles,

         -- Trips KPIs (filtered by vehicle filters via join to filtered_vehicles)
         (SELECT COUNT(*)
          FROM trips t
          JOIN filtered_vehicles v ON v.id = t.vehicle_id
          WHERE t.status = 'Dispatched'
         ) AS active_trips,

         (SELECT COUNT(*)
          FROM trips t
          JOIN filtered_vehicles v ON v.id = t.vehicle_id
          WHERE t.status = 'Draft'
         ) AS pending_trips,

         -- Drivers KPI (not vehicle dependent)
         (SELECT COUNT(*) FROM drivers d WHERE d.status = 'On Trip') AS drivers_on_duty
       `,
      params,
    );

    return res.json({
      activeVehicles: Number(q.rows[0].active_vehicles) || 0,
      availableVehicles: Number(q.rows[0].available_vehicles) || 0,
      vehiclesInMaintenance: Number(q.rows[0].in_maintenance_vehicles) || 0,
      activeTrips: Number(q.rows[0].active_trips) || 0,
      pendingTrips: Number(q.rows[0].pending_trips) || 0,
      driversOnDuty: Number(q.rows[0].drivers_on_duty) || 0,
      fleetUtilizationPercent: (() => {
        const onTrip = Number(q.rows[0].on_trip_vehicles) || 0;
        const total = Number(q.rows[0].total_non_retired_vehicles) || 0;
        if (!total) return 0;
        return Number(((onTrip / total) * 100).toFixed(2));
      })(),
    });
  } catch (err) {
    next(err);
  }
});

// Backwards-compatible root
router.get("/", (req, res) => {
  return res.json({
    message: "Dashboard API ready. Use GET /api/dashboard/summary",
  });
});

export default router;
