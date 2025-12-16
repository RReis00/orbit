# Orbit

Orbit is a **location-based event tracking web application** that allows participants of an event to share their location in real time within a defined radius (geofence). The application focuses on **live location updates, privacy controls, and rule-based alerts**, providing a clear and extensible foundation for real-time, map-driven experiences.

The project is currently frontend-focused, using mocked APIs to simulate backend behaviour while keeping the architecture realistic and production-oriented.

---

## Core Features

* **Event creation and management**
* **Live location sharing** per participant
* **Interactive map visualization** using Leaflet
* **Geofence (radius) configuration** around event locations
* **Rule-based alerts** when participants enter or leave defined areas
* **Privacy controls** (location precision blur)
* **Periodic live updates** with UI feedback

---

## How Orbit Works (High-Level Flow)

1. A user creates or joins an event
2. Each participant can enable or disable live location sharing
3. The client periodically sends location updates
4. The system evaluates:

   * distance to event center
   * geofence rules
   * alert conditions
5. The UI updates the live map and notifies users of relevant events

This flow is fully implemented end-to-end using a mocked backend layer.

---

## Tech Stack

### Frontend

* **React**
* **TypeScript**
* **Vite**
* **React Router**
* **Leaflet / React-Leaflet**

### State & Logic

* Custom React hooks
* Context-based providers
* Strongly typed domain models

### Tooling

* Git & GitHub
* Modular project structure

---

## Architecture Overview

The project is structured around clear separation of concerns:

* `pages/` – Application routes and page-level components
* `features/` – Domain-focused UI logic (map, events, alerts)
* `lib/` – Core logic, hooks, utilities and type definitions
* `mocks/` – Mocked backend logic simulating API behaviour

### Mocked Backend Layer

The `mocks/` folder simulates a real backend and is intentionally designed to:

* Handle event and participant state
* Process location updates
* Apply geofence and alert rules
* Emit notification events

This approach allows the frontend to behave as if it were connected to a real API while keeping the project self-contained.

---

## Live Location Updates

* Location updates are sent **periodically** (polling-based)
* Each update includes:

  * coordinates
  * timestamp
  * precision settings
* The system recalculates:

  * distance to event center
  * inside / outside geofence state

The polling strategy was chosen for simplicity and predictability, but the architecture allows future replacement with WebSockets or Server-Sent Events.

---

## Geofence & Alert Rules

Orbit supports two types of alert rules:

* **Event-level rules** (apply to all participants)
* **Member-level rules** (specific to a participant)

Rules trigger notifications when participants:

* enter the defined radius
* leave the defined radius

Alerts are dispatched through an internal event bus and displayed via toast notifications in the UI.

---

## Privacy Considerations

To avoid exposing exact user locations:

* Location precision can be **blurred** before being processed
* Sharing can be toggled on/off per participant
* The system is designed with privacy-first assumptions

---

## Running the Project Locally

```bash
npm install
npm run dev
```

The application runs entirely on the frontend using mocked APIs.

---

## Demo & Testing Notes

* Seed data is provided to simulate events and participants
* Multiple participants can be tested by opening the app in different browser tabs
* Location movement can be simulated via the map picker

---

## Current Status

* Frontend architecture complete
* Core flows implemented
* Backend layer mocked for development and demonstration

Planned future improvements include:

* Real backend integration
* Real-time transport (WebSockets / SSE)
* Authentication & persistence

---

## Key Takeaways

Orbit is a project focused on **problem-solving and architecture**, not just UI.
It demonstrates:

* Handling of real-time-like data flows
* Spatial logic (distance, radius, geofencing)
* State synchronization between map, UI, and background processes
* Thoughtful trade-offs between complexity and clarity

---

## License

This project is for educational and portfolio purposes.

