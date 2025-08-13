# ZoneSight UI — Real-time People & Occupancy Dashboard

React + Vite + TypeScript frontend for [ZoneSight API](https://github.com/Leo10250/ZoneSight-API).  
Displays live annotated MJPEG video and real-time detection metrics over WebSockets.  
Built as the foundation for zone-based occupancy, dwell time analytics, and event history.

## Stack
- Frontend: React, Vite, TypeScript, WebSocket
- Styling: CSS
- Dev: Node.js 18+, Vite dev server with LAN support

## Setup (PowerShell / Windows)
```powershell
# clone repo
git clone https://github.com/Leo10250/ZoneSight-UI.git
cd ZoneSight-UI

# install deps
npm install

# set backend API base URL (update to your LAN IP for phone viewing)
echo VITE_API_BASE_URL=http://localhost:8000 > .env.local

# run dev server (LAN access)
npm run dev -- --host
