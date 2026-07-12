# TODO

<<<<<<< HEAD
## Vehicle Registry (TransitOps)
- [ ] Implement backend CRUD + auth/role protection + status filtering + uniqueness error message for /api/vehicles
- [ ] Implement frontend Vehicles page table + status badges
- [ ] Add shared VehicleForm component for Add/Edit (Fleet Manager only)
- [ ] Implement VehicleAdd and VehicleEdit pages wiring to backend
- [ ] Inline form error display for duplicate registration number
- [ ] Verify by running backend + frontend and checking role-based access
=======
## Driver Management (TransitOps)
- [x] Backend: implement full CRUD for `/api/drivers` with availability query filter.
- [x] Backend: protect POST/PUT/DELETE with `requireAuth + requireRole(['Fleet Manager','Safety Officer'])`.
- [x] Frontend: implement Drivers list UI (table + expired badge).
- [x] Frontend: implement Add/Edit Driver form.
- [x] Frontend: add DriverAdd/DriverEdit routes and page components.
- [ ] Run backend/frontend and manually verify role-based access + CRUD behavior.


>>>>>>> f956edb (Completed fourth task)
