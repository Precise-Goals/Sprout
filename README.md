
# Structured Report: Data-driven Crop & Irrigation Platform

---

## 🔹 Problem

Farmers lack a simple platform that merges **weather forecasts**, **yield history**, and **soil/water data** to predict **crop cycles and irrigation schedules**. Current solutions are fragmented or paid, limiting accessibility.

---

## 🔹 Solution

A **monolithic Next.js app** (with Leaflet maps + API routes) that:

* Collects weather + soil + historical yield data.
* Runs **rule-based models** (and ML later).
* Predicts crop cycles & irrigation schedules.
* Delivers guidance via **dashboard + SMS/email export**.
* Uses **free-tier APIs** and **open datasets** to remain cost-free initially.

---

## 🔹 Techstack (Minimal)

* **Frontend/UI** → Next.js (monolithic app) + TailwindCSS (styling).
* **Maps** → Leaflet.js (free + OSM tiles).
* **Database** → Supabase (free Postgres + Auth + Storage) or SQLite (if self-hosting MVP).
* **APIs** → Next.js API routes (server-side).
* **ML/Models** → Rule-based irrigation engine inside Next.js API routes (later optional: Python FastAPI microservice).
* **Notifications** → Email (free via Resend / Gmail SMTP). SMS (paid, skip in MVP).

---

## 🔹 Free APIs & Links You’ll Need

### 🌦 Weather APIs

* **Open-Meteo (Free, No API Key)** → Weather forecast & historical data.
  🔗 [https://open-meteo.com/](https://open-meteo.com/)
* **WeatherAPI (Free tier)** → More detailed forecasts.
  🔗 [https://www.weatherapi.com/](https://www.weatherapi.com/)

### 🌱 Soil & Crop Data

* **SoilGrids (ISRIC)** → Global soil properties (texture, pH, organic carbon).
  🔗 [https://soilgrids.org/](https://soilgrids.org/)
  API docs: [https://rest.soilgrids.org/](https://rest.soilgrids.org/)

* **FAO AgroDataCube** (open agri datasets).
  🔗 [https://data.wur.nl/datasets/agrodatacube](https://data.wur.nl/datasets/agrodatacube)

### 🛰 Remote Sensing (optional, free tier)

* **Sentinel Hub (EO Browser)** → Satellite data (NDVI, crop health).
  🔗 [https://www.sentinel-hub.com/explore/eobrowser/](https://www.sentinel-hub.com/explore/eobrowser/)

* **Google Earth Engine (free for research)** → Satellite analytics.
  🔗 [https://earthengine.google.com/](https://earthengine.google.com/)

### 📍 Maps / Geocoding

* **Leaflet.js** → Free map rendering.
  🔗 [https://leafletjs.com/](https://leafletjs.com/)
* **OpenStreetMap Tiles (free)** → Map base layer.
  🔗 [https://www.openstreetmap.org/](https://www.openstreetmap.org/)
* **Nominatim (free geocoding)** → Address ↔ lat/long.
  🔗 [https://nominatim.org/release-docs/develop/api/Search/](https://nominatim.org/release-docs/develop/api/Search/)

### 📊 Market Prices (India-specific)

* **Agmarknet (Gov. of India)** → Daily mandi prices.
  🔗 [https://agmarknet.gov.in/](https://agmarknet.gov.in/)

### 📤 Communication

* **Resend (free email API)** → Simple farmer reports.
  🔗 [https://resend.com/](https://resend.com/)
* **Gmail SMTP (free)** → Email via Gmail.
  Docs: [https://support.google.com/a/answer/176600?hl=en](https://support.google.com/a/answer/176600?hl=en)

---

## 🔹 Core Features (Monolithic Next.js MVP)

1. **Farmer Dashboard**

   * Leaflet map (draw/select farm location).
   * Weather forecast widget (Open-Meteo).
   * Soil profile (SoilGrids API).

2. **Crop Cycle Prediction**

   * Planting → Harvest timeline (based on crop type + weather).
   * Seasonal suitability suggestions.

3. **Irrigation Scheduling**

   * Rule-based (crop coefficient + evapotranspiration from weather API).
   * Calendar of irrigation dates/amounts.

4. **Yield History Upload**

   * CSV upload (Supabase Storage).
   * Visualize yield vs weather patterns.

5. **Reports & Alerts**

   * Export irrigation/crop cycle plan as PDF.
   * Email notifications (Resend/Gmail SMTP).

---

## 🔹 External Innovative Features (Free-first approach)

1. **Offline-first PWA** (farmers with poor connectivity).
2. **Geo-fencing alerts** (flood, heatwave risk).
3. **Community benchmarking** (compare yields anonymously).
4. **Open crop advisory dataset integration** (FAO / ICAR).
5. **Multilingual UI** (Next.js i18n).
6. **Simple ML model** (train with uploaded yield history).
7. **Satellite NDVI check** (Sentinel free tier).
8. **Voice reports (TTS)** via browser or free Google TTS.

---

## 🔹 Feasibility to Farmers

* **Free APIs** → ensures no upfront farmer cost.
* **Leaflet + OSM** → no map subscription fees.
* **Offline PWA + Email export** → works even with poor connectivity.
* **Low device requirements** → runs on cheap Android phones.

---

## 🔹 Conclusion

You can build a **self-contained monolithic Next.js app** that uses **Leaflet maps + free weather/soil APIs** to give farmers actionable crop & irrigation insights.

* No need for Bun split — keep it in Next.js APIs.
* Free APIs (Open-Meteo, SoilGrids, OSM) ensure cost-effectiveness.
* MVP should start with rule-based irrigation + crop cycle models, then later extend with satellite, ML, and SMS/voice features.

# Contributors
- Sarthak Patil - Core Fullstack Programmer
- Utkarsh Vidwat - Data and API Engineer
- Prathamesh Kolhe - ML Engineer
