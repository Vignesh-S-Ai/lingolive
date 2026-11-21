# INSTALL.md - Real-Time Multilingual Translator

This guide walks you through setting up the **Real-Time Multilingual Translator** application locally. It covers prerequisites, backend and frontend setup, running the application, testing, and common troubleshooting tips.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version/Details | Installation Link |
|-------------|-----------------|-------------------|
| **Python** | `>=3.10` (prefer 3.11 or 3.12) | <https://www.python.org/downloads/> |
| **Node.js** | `>=18` (LTS) | <https://nodejs.org/> |
| **npm** | Comes with Node.js (>=9) | – |
| **LiveKit Account** | Required for real-time audio/video transport | <https://livekit.io/> |
| **Gnani API Key** | API key for multilingual TTS/STT service | Register at <https://gnani.ai/> |
| **Git** | For cloning the repository | <https://git-scm.com/> |

### 1.1 Python Dependencies

The backend is built with **FastAPI** and relies on a `requirements.txt` (or `pyproject.toml`). The minimum Python version is **3.10** because of type‑hint features and async IO.

### 1.2 Node.js Dependencies

The frontend uses **Vite** + **React**. Node 18+ ensures compatibility with the latest Vite plugins.

### 1.3 LiveKit & Gnani Credentials

- Sign up for a **LiveKit** account and note your `LIVEKIT_URL` and `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`.
- Register for a **Gnani** account and obtain an API key (e.g., `GNANI_API_KEY`). This key will be used for speech‑to‑text and text‑to‑speech in multiple languages.

---
## 2. Backend Setup

The backend runs on Python and provides the API endpoints, LiveKit room management, and Gnani integration.

### 2.1 Clone the Repository

```bash
git clone https://github.com/yourorg/realtime-translator.git
cd realtime-translator
```

### 2.2 Create a Virtual Environment (optional but recommended)

```bash
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate    # macOS / Linux
```

### 2.3 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **Tip:** If you encounter compilation issues with native modules, ensure you have the Microsoft Visual C++ Build Tools on Windows or `build-essential` on Linux.

### 2.4 Environment Configuration

Create a `.env` file in the `backend/` directory (or at the project root) with the following variables:

```dotenv
# LiveKit
LIVEKIT_URL=wss://your-livekit-region.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Gnani TTS/STT
GNANI_API_KEY=your_gnani_api_key
GNANI_API_SECRET=your_gnani_api_secret  # optional, if required by Gnani

# Application
APP_NAME=realtime-translator
DEBUG=True   # set to False for production
```

> **Important:** Never commit real secrets. Add `.env` to `.gitignore`.

### 2.5 Database Setup (if applicable)

If the project uses a database (e.g., PostgreSQL for user sessions or translation history):

```bash
# Example using PostgreSQL
createdb realtime_translator
# Adjust DATABASE_URL in .env if needed:
DATABASE_URL=postgresql://localhost/realtime_translator
```

### 2.6 Run Migrations / Seed Data

```bash
# Assuming Alembic is used for Alembic migrations
alembic upgrade head
```

If the project includes a script to seed default data:

```bash
python scripts/seed_db.py
```

### 2.7 Verify Backend Startup

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Visit `http://localhost:8000/docs` to view the auto‑generated OpenAPI documentation.

---
## 3. Frontend Setup

The frontend is a React app bootstrapped with **Vite**.

### 3.1 Navigate to the Frontend Directory

```bash
cd frontend   # if the folder is named "frontend"
# or stay at root if the source is directly under the project.
```

### 3.2 Install Node Packages

```bash
npm install
```

### 3.3 Environment Variables (Frontend)

Create a `.env` file in the `frontend/` directory:

```dotenv
# LiveKit
VITE_LIVEKIT_URL=wss://your-livekit-region.livekit.cloud
VITE_LIVEKIT_API_KEY=your_livekit_api_key

# Optional: Gnani public config (if your frontend needs to know the key)
VITE_GNANI_API_KEY=your_gnani_api_key
```

> **Note:** Vite prefixes `VITE_` to expose variables to the browser; keep secrets you don’t want exposed out of the frontend.

### 3.4 Build / Dev Server

Start the Vite development server:

```bash
npm run dev
```

The console will output something like:

```
  VITE   Local:   http://localhost:5173
  VITE   Network: http://192.168.1.42:5173
```

Open the provided URL in your browser.

### 3.5 Production Build (optional)

```bash
npm run build
```

The built files will be in `dist/` and can be served via any static server (e.g., `npx serve dist`).

---
## 4. How to Run the Application

The application consists of two parts that need to run concurrently: the **backend** (Python/FastAPI) and the **frontend** (React/Vite). You can start them in separate terminals or use Docker Compose.

### 4.1 Separate Terminals (Recommended)

1. **Backend terminal**

   ```bash
   cd backend   # or your Python package location
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend terminal** (keep this open)

   ```bash
   cd frontend
   npm run dev
   ```

   Open `http://localhost:5173` in your browser.

   The frontend will connect to the backend via `http://localhost:8000` (as defined in the Vite env) and to LiveKit using the URL/API key you set.

### 4.2 Using Docker Compose (optional)

If you prefer a containerized setup, a `docker-compose.yml` may be provided:

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db   # if using a DB service
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    env_file: .env.frontend
  # optional: add a LiveKit room service or Gnani mock here
```

Run:

```bash
docker-compose up --build
```

Visit `http://localhost:5173` and the API at `http://localhost:8000`.

### 4.3 Quick Start Script (optional)

Some projects ship a `start.sh` that launches both sides:

```bash
# Example (if present)
./start.sh
```

Check the repository root for such a script.

---
## 5. Testing the Application

### 5.1 Backend Tests

```bash
# From the backend directory
pytest
# or, if using unittest
python -m unittest discover
```

Typical test file locations: `backend/tests/`. Ensure tests cover:

- API endpoint responses.
- LiveKit room creation.
- Gnani TTS/STT integration (mocked).

### 5.2 Frontend Tests

```bash
npm test
```

Vite + React Testing Library is usually configured; tests live under `frontend/src/__tests__/` or `frontend/tests/`.

### 5.3 End‑to‑End Flow Test

1. Start the backend and frontend as described in **Section 4**.
2. Open the frontend URL (`http://localhost:5173`).
3. Click **“Start Room”** – the app should create a LiveKit room and display a local audio track.
4. Speak a phrase in English (or another supported language). The audio is sent to Gnani for STT, translated, and then played back via Gnani TTS.
5. Verify that the translated text appears on screen and the audio plays.

If the above works, the integration is fully functional.

### 5.4 Gnani Import Test (as mentioned in the request)

The repository may contain a dedicated script to verify Gnani connectivity:

```bash
# From the project root
python -m scripts.test_gnani_import
```

This script typically:

- Sends a short audio sample to Gnani’s STT endpoint.
- Prints the recognized text.
- Confirms the API key is valid.

Check the output for “Success” or any error messages (e.g., authentication failure, quota exceeded).

---
## 6. Common Troubleshooting Tips

| Issue | Possible Cause | Fix |
|-------|----------------|-----|
| **`ModuleNotFoundError: No module named 'fastapi'`** | Virtual environment not activated or `requirements.txt` not installed. | Activate venv and run `pip install -r requirements.txt`. |
| **LiveKit connection fails (e.g., `UNKNOWN_URL`)** | Wrong `LIVEKIT_URL` or API keys in `.env`. | Double‑check the values against your LiveKit dashboard; ensure the URL scheme is `wss://`. |
| **Gnani API returns `401 Unauthorized`** | Invalid or expired `GNANI_API_KEY`. | Regenerate the key at <https://gnani.ai/> and update `.env`. |
| **Frontend shows blank screen / Vite HMR not updating** | Port conflict or `.env` mis‑configuration. | Ensure `VITE_LIVEKIT_URL` and `VITE_LIVEKIT_API_KEY` are set; try `npm run build && npx serve dist` to test production build. |
| **Database migration error (Alembic)** | Missing `alembic.ini` or model changes not reflected. | Run `alembic init` if missing, then `alembic revision --autogenerate -m "init"` and `alembic upgrade head`. |
| **Audio echo or feedback in the call** | Both local mic and remote track are enabled simultaneously. | The frontend should mute the local track when remote audio plays; check the UI controls. |
| **Docker compose fails to start** | Missing environment variables or port already in use. | Verify `.env` files, run `docker-compose down` and `docker-compose up --build` again. |
| **`uvicorn` cannot bind to port 8000** | Port already occupied by another service. | Kill the process using the port or change `PORT` in `.env`. |
| **Translated text appears but audio is mute** | Gnani TTS missing audio format support. | Check Gnani documentation for supported audio codecs; convert if necessary. |

### General Tips

- **Keep `.env` secret:** Never commit real API keys or secrets. Add `.env` to `.gitignore`.
- **Use separate terminals:** Running backend and frontend concurrently is easier in two PowerShell/terminal windows.
- **Check logs:** Both `uvicorn` and Vite provide real‑time logs that are invaluable for debugging connection issues.
- **Version compatibility:** Ensure Python >=3.10, Node >=18, and the respective package versions match what the project expects (see `requirements.txt` and `package.json`).
- **Clean start:** If you experience strange state issues, `docker-compose down -v` (or `rm -rf venv` and `rm -rf node_modules` followed by reinstall) often resolves hidden problems.

---