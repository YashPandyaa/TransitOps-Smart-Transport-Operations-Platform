import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

// GET /api/reports/vehicles
// Returns an analytics row per vehicle with 4 key metrics:
//   1. fuel_efficiency_km_per_l  — SUM(planned_distance) / SUM(fuel_consumed) from Completed trips
//   2. fleet_utilization_pct     — fleet-wide On Trip / non-Retired * 100 (same value on every row)
//   3. operational_cost          — fuel_logs.cost + maintenance_logs.cost + expenses.amount
//   4. roi_pct                   — (revenue - fuel - maintenance) / acquisition_cost * 100
//      revenue                   — SUM(planned_distance) * $2/km for Completed trips
router.get('/vehicles', async (req, res, next) => {
  try {
    const query = `
      WITH
        -- Fleet-wide utilization (one row)
        fleet_util AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'On Trip')   AS on_trip,
            COUNT(*) FILTER (WHERE status != 'Retired')  AS active_total
          FROM vehicles
        ),

        -- Completed trip aggregates per vehicle
        trip_stats AS (
          SELECT
            vehicle_id,
            COUNT(*)                                              AS trips_completed,
            COALESCE(SUM(planned_distance), 0)                   AS total_distance,
            COALESCE(
              SUM(fuel_consumed) FILTER (WHERE fuel_consumed > 0),
              0
            )                                                     AS total_fuel_consumed
          FROM trips
          WHERE status = 'Completed'
          GROUP BY vehicle_id
        ),

        -- Fuel log costs per vehicle
        fuel_stats AS (
          SELECT vehicle_id, COALESCE(SUM(cost), 0) AS fuel_cost
          FROM fuel_logs
          GROUP BY vehicle_id
        ),

        -- Maintenance costs per vehicle
        maint_stats AS (
          SELECT vehicle_id, COALESCE(SUM(cost), 0) AS maintenance_cost
          FROM maintenance_logs
          GROUP BY vehicle_id
        ),

        -- Other expenses per vehicle
        expense_stats AS (
          SELECT vehicle_id, COALESCE(SUM(amount), 0) AS other_cost
          FROM expenses
          GROUP BY vehicle_id
        )

      SELECT
        v.id                        AS vehicle_id,
        v.registration_number,
        v.name_model,
        v.type,
        v.status,
        v.acquisition_cost,

        -- 1. Fuel Efficiency (km/L) — null when no completed trip data
        CASE
          WHEN COALESCE(t.total_fuel_consumed, 0) > 0
          THEN ROUND((t.total_distance / t.total_fuel_consumed)::NUMERIC, 2)
          ELSE NULL
        END                         AS fuel_efficiency_km_per_l,

        -- 2. Fleet Utilization % (fleet-wide, same value on every row)
        CASE
          WHEN fu.active_total > 0
          THEN ROUND((fu.on_trip::NUMERIC / fu.active_total * 100), 1)
          ELSE 0
        END                         AS fleet_utilization_pct,

        -- Trip summary
        COALESCE(t.trips_completed, 0)    AS trips_completed,
        COALESCE(t.total_distance, 0)     AS total_distance_km,

        -- 3. Operational Cost breakdown
        COALESCE(f.fuel_cost, 0)          AS fuel_cost,
        COALESCE(m.maintenance_cost, 0)   AS maintenance_cost,
        COALESCE(e.other_cost, 0)         AS other_expense_cost,
        COALESCE(f.fuel_cost, 0)
          + COALESCE(m.maintenance_cost, 0)
          + COALESCE(e.other_cost, 0)     AS operational_cost,

        -- Revenue: $2 flat rate per km of completed trips
        ROUND((COALESCE(t.total_distance, 0) * 2.0)::NUMERIC, 2) AS revenue,

        -- 4. ROI %: (Revenue - Fuel - Maintenance) / Acquisition Cost × 100
        CASE
          WHEN v.acquisition_cost > 0
          THEN ROUND(
            (
              (COALESCE(t.total_distance, 0) * 2.0)
              - COALESCE(f.fuel_cost, 0)
              - COALESCE(m.maintenance_cost, 0)
            ) / v.acquisition_cost * 100,
            2
          )
          ELSE NULL
        END                         AS roi_pct

      FROM vehicles v
      CROSS JOIN fleet_util fu
      LEFT JOIN trip_stats  t ON t.vehicle_id = v.id
      LEFT JOIN fuel_stats  f ON f.vehicle_id = v.id
      LEFT JOIN maint_stats m ON m.vehicle_id = v.id
      LEFT JOIN expense_stats e ON e.vehicle_id = v.id
      ORDER BY v.registration_number ASC
    `

    const { rows } = await pool.query(query)

    // Parse all numeric fields so JSON contains numbers not strings
    const parsed = rows.map(r => ({
      vehicle_id:              parseInt(r.vehicle_id, 10),
      registration_number:     r.registration_number,
      name_model:              r.name_model,
      type:                    r.type,
      status:                  r.status,
      acquisition_cost:        parseFloat(r.acquisition_cost),
      fuel_efficiency_km_per_l: r.fuel_efficiency_km_per_l !== null ? parseFloat(r.fuel_efficiency_km_per_l) : null,
      fleet_utilization_pct:   parseFloat(r.fleet_utilization_pct),
      trips_completed:         parseInt(r.trips_completed, 10),
      total_distance_km:       parseFloat(r.total_distance_km),
      fuel_cost:               parseFloat(r.fuel_cost),
      maintenance_cost:        parseFloat(r.maintenance_cost),
      other_expense_cost:      parseFloat(r.other_expense_cost),
      operational_cost:        parseFloat(r.operational_cost),
      revenue:                 parseFloat(r.revenue),
      roi_pct:                 r.roi_pct !== null ? parseFloat(r.roi_pct) : null,
    }))

    return res.json(parsed)
  } catch (error) {
    next(error)
  }
})

export default router
