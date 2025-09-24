# Structured Report: Sprout — Data-driven Crop & Irrigation Platform

---

## 🔹 Problem

Farmers lack a simple platform that merges **weather forecasts**, **yield history**, and **soil/water data** to predict **crop cycles and irrigation schedules**. Current solutions are fragmented or paid, limiting accessibility.

---

## 🔹 Solution

A **monolithic Next.js app** (with Leaflet maps + API routes) that:

- Collects weather + soil + historical yield data.
- Runs **rule-based models** (and ML later).
- Predicts crop cycles & irrigation schedules.
- Delivers guidance via **dashboard + SMS/email export**.
- Uses **free-tier APIs** and **open datasets** to remain cost-free initially.

---

## 🔹 Techstack (Minimal)

- **Frontend/UI** → Next.js (monolithic app) + TailwindCSS.
- **Maps** → Leaflet.js (free + OSM tiles).
- **Database** → Supabase (free Postgres + Auth + Storage) or SQLite (self-hosted MVP).
- **APIs** → Next.js API routes (server-side logic).
- **ML/Models** → Rule-based irrigation engine inside Next.js API routes (optional Python FastAPI microservice later).
- **Notifications** → Email (free via Resend / Gmail SMTP), SMS (skip for MVP).

---

## 🔹 Free APIs & Links

### 🌦 Weather APIs

- **Open-Meteo (Free, No API Key)** → Weather forecast & historical data. 🔗 [open-meteo.com](https://open-meteo.com/)
- **WeatherAPI (Free tier)** → More detailed forecasts. 🔗 [weatherapi.com](https://www.weatherapi.com/)

### 🌱 Soil & Crop Data

- **SoilGrids (ISRIC)** → Global soil properties. 🔗 [soilgrids.org](https://soilgrids.org/), API: [rest.soilgrids.org](https://rest.soilgrids.org/)
- **FAO AgroDataCube** → Open agri datasets. 🔗 [data.wur.nl](https://data.wur.nl/datasets/agrodatacube)

### 🛰 Remote Sensing (optional)

- **Sentinel Hub / EO Browser** → NDVI, crop health. 🔗 [sentinel-hub.com](https://www.sentinel-hub.com/explore/eobrowser/)
- **Google Earth Engine** → Free satellite analytics. 🔗 [earthengine.google.com](https://earthengine.google.com/)

### 📍 Maps / Geocoding

- **Leaflet.js** → Free map rendering. 🔗 [leafletjs.com](https://leafletjs.com/)
- **OpenStreetMap Tiles** → Base map. 🔗 [openstreetmap.org](https://www.openstreetmap.org/)
- **Nominatim** → Free geocoding. 🔗 [nominatim.org](https://nominatim.org/release-docs/develop/api/Search/)

### 📊 Market Prices (India)

- **Agmarknet** → Daily mandi prices. 🔗 [agmarknet.gov.in](https://agmarknet.gov.in/)

### 📤 Communication

- **Resend (Free Email API)** → Farmer reports. 🔗 [resend.com](https://resend.com/)
- **Gmail SMTP** → Free email via Gmail. Docs: [support.google.com](https://support.google.com/a/answer/176600?hl=en)

---

## 🔹 Core Features (Monolithic Next.js MVP)

1. **Farmer Dashboard**

   - Leaflet map (draw/select farm location)
   - Weather forecast widget (Open-Meteo)
   - Soil profile (SoilGrids API)

2. **Crop Cycle Prediction**

   - Planting → Harvest timeline (crop type + weather)
   - Seasonal suitability suggestions

3. **Irrigation Scheduling**

   - Rule-based (crop coefficient + evapotranspiration)
   - Calendar of irrigation dates/amounts

4. **Yield History Upload**

   - CSV upload (Supabase Storage)
   - Visualize yield vs weather patterns

5. **Reports & Alerts**

   - Export irrigation/crop cycle plan as PDF
   - Email notifications (Resend/Gmail SMTP)

---

## 🔹 External Innovative Features

1. Offline-first PWA for low connectivity areas
2. Geo-fencing alerts (flood, heatwave)
3. Community benchmarking (compare yields anonymously)
4. Open crop advisory dataset integration (FAO / ICAR)
5. Multilingual UI (Next.js i18n)
6. Simple ML model (train with uploaded yield history)
7. Satellite NDVI monitoring (Sentinel free tier)
8. Voice reports (TTS via browser / free Google TTS)

---

## 🔹 Feasibility to Farmers

- **Free APIs** → no cost
- **Leaflet + OSM** → no map fees
- **Offline PWA + Email export** → works with poor connectivity
- **Low device requirements** → runs on cheap Android phones

---

## 🔹 Conclusion

A **monolithic Next.js app** can provide actionable crop & irrigation insights using **free weather/soil APIs + Leaflet maps**. MVP focuses on **rule-based irrigation + crop cycle models**, with optional satellite, ML, and WhatsApp/multilingual features later.

---

## Contributors

- Sarthak Patil - Core Fullstack Programmer
- Utkarsh Vidwat - Data and API Engineer
- Prathamesh Kolhe - ML Engineer
