# TODO

## Vehicle Registry (TransitOps)
- [x] Implement backend CRUD + auth/role protection + status filtering + uniqueness error message for `/api/vehicles`.
- [x] Implement frontend Vehicles page table + status badges.
- [x] Add shared VehicleForm component for Add/Edit (Fleet Manager only).
- [x] Implement VehicleAdd and VehicleEdit pages wiring to backend.
- [x] Inline form error display for duplicate registration number.
- [ ] Manually verify role-based vehicle access + CRUD behavior in browser.

## Driver Management (TransitOps)
- [x] Backend: implement full CRUD for `/api/drivers` with availability query filter.
- [x] Backend: protect POST/PUT/DELETE with `requireAuth + requireRole(['Fleet Manager','Safety Officer'])`.
- [x] Frontend: implement Drivers list UI (table + expired badge).
- [x] Frontend: implement Add/Edit Driver form.
- [x] Frontend: add DriverAdd/DriverEdit routes and page components.
- [ ] Manually verify role-based driver access + CRUD behavior in browser.

## Operations Features
- [x] Merge trips lifecycle APIs.
- [x] Merge maintenance, fuel, expenses, and reports APIs.
- [x] Replace placeholder frontend pages with API-backed operational pages.
- [ ] Add focused automated tests for transactional trip dispatch and completion.
