<div align="center">

# ⚡ CodeRunner

### A mobile code editor that runs real code — on your phone.

Write **JavaScript · Python · Java · C++** with full syntax highlighting,
execute it on your local backend via ngrok, and see live terminal output.

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-0d1117?style=for-the-badge&logo=react)
![React Native](https://img.shields.io/badge/React_Native-TypeScript-58a6ff?style=for-the-badge&logo=react)
![Spring Boot](https://img.shields.io/badge/Backend-Spring_Boot_3-3fb950?style=for-the-badge&logo=springboot)
![ngrok](https://img.shields.io/badge/Tunnel-ngrok-f0883e?style=for-the-badge)

</div>

---

## What It Does

| Feature | Details |
|---|---|
| 🖊️ Code Editor | CodeMirror 5 inside a WebView — syntax highlighting, line numbers, bracket matching |
| 🌐 4 Languages | JavaScript, Python, Java, C++ — switchable via tabs |
| 🔍 Zoom Controls | A− / A+ buttons adjust font size from 11px to 24px live |
| ▶️ Run Code | Sends code to your Spring Boot backend, shows real stdout/stderr |
| 🖥️ Terminal Output | Color-coded console — errors in red, warnings in orange, output in green |
| 🔒 ngrok Tunnel | Securely connects your phone to your local PC backend over HTTPS |

---

## Project Structure

```
CodeRunner/                          ← React Native App
├── App.tsx                          ← Root: fetch logic, language tabs, zoom
├── src/
│   └── components/
│       ├── CodeEditor.tsx           ← WebView + CodeMirror editor
│       └── ConsoleOutput.tsx        ← Terminal display with auto-scroll
├── android/                         ← Android native project
├── ios/                             ← iOS native project
├── package.json
└── README.md

coderunner-backend/                  ← Spring Boot Backend (separate project)
├── src/main/java/com/coderunner/
│   ├── CodeRunnerApplication.java
│   ├── controller/
│   │   └── ExecuteController.java   ← POST /api/execute
│   ├── service/
│   │   └── ExecuteService.java      ← Spawns subprocesses per language
│   └── config/
│       └── CorsConfig.java          ← Global CORS config
└── src/main/resources/
    └── application.properties       ← port=9090, address=0.0.0.0
```

---

## Prerequisites

Install **everything** in this table before starting. Missing any one of these
is the most common reason setup fails.

### React Native App

| Tool | Min Version | How to Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Bundled with Node.js |
| React Native CLI | Latest | `npm install -g react-native-cli` |
| Android Studio | Latest | https://developer.android.com/studio |
| JDK | 17+ | https://adoptium.net |
| Watchman *(macOS only)* | Latest | `brew install watchman` |

### Spring Boot Backend

| Tool | Min Version | How to Install |
|---|---|---|
| JDK | 17+ | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org |
| Node.js | 18+ | Required to execute JavaScript code |
| Python | 3.8+ | Required to execute Python code |
| GCC / G++ | Any | Required to compile and run C++ code |

### Tunnel

| Tool | How to Install |
|---|---|
| ngrok | https://ngrok.com/download — free account required |

---

## How It All Connects

```
 ┌─────────────────────────────┐
 │      Your Phone / Emulator  │
 │                             │
 │   ┌─────────────────────┐   │
 │   │  CodeMirror Editor  │   │
 │   │  (inside WebView)   │   │
 │   └─────────────────────┘   │
 │                             │
 │   [ ▶  RUN CODE ]           │
 │                             │
 │   ┌─────────────────────┐   │
 │   │  TERMINAL OUTPUT    │   │
 │   │  $ run              │   │
 │   │  Hello, World! ▋    │   │
 │   └─────────────────────┘   │
 └──────────┬──────────────────┘
            │
            │  HTTPS POST /api/execute
            │  + ngrok-skip-browser-warning: 1
            │  + User-Agent: CodeRunnerApp/1.0
            ▼
 ┌─────────────────────────────┐
 │        ngrok Tunnel         │
 │  (public URL → your PC)     │
 └──────────┬──────────────────┘
            │
            ▼
 ┌─────────────────────────────┐
 │   Spring Boot  :9090        │
 │   POST /api/execute         │
 │                             │
 │   → spawns subprocess       │
 │   → captures stdout/stderr  │
 │   → returns JSON            │
 └─────────────────────────────┘
```

---

## Part 1 — Spring Boot Backend

### Step 1 — Navigate to the backend folder

```bash
cd coderunner-backend/
```

### Step 2 — Set `application.properties`

Open `src/main/resources/application.properties` and make sure it has:

```properties
server.port=9090
server.address=0.0.0.0
```

> `0.0.0.0` binds Spring Boot to all network interfaces — required for ngrok to reach it.
> If this is set to `localhost` or `127.0.0.1`, ngrok will get a 502 error.

### Step 3 — Set up CORS correctly

This is critical. `@CrossOrigin(origins = "*")` alone is **not enough** — it doesn't
allow the custom ngrok header and will silently block your requests.

**Option A — Global config (recommended, add this new file):**

```java
// src/main/java/com/coderunner/config/CorsConfig.java

package com.coderunner.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowedHeaders(
                "Content-Type",
                "Accept",
                "User-Agent",
                "ngrok-skip-browser-warning"    // ← this line is the critical one
            )
            .maxAge(3600);
    }
}
```

Then remove `@CrossOrigin` from your controller entirely.

**Option B — Keep it on the controller:**

```java
@CrossOrigin(
    origins = "*",
    allowedHeaders = {
        "Content-Type",
        "Accept",
        "User-Agent",
        "ngrok-skip-browser-warning"            // ← must be listed explicitly
    },
    methods = { RequestMethod.POST, RequestMethod.OPTIONS }
)
@PostMapping("/api/execute")
public ResponseEntity<?> execute(@RequestBody ExecuteRequest request) {
    // your code
}
```

### Step 4 — Build and run the backend

```bash
# Option A — Maven wrapper (recommended, no Maven install needed)
./mvnw spring-boot:run

# Option B — System Maven
mvn spring-boot:run

# Option C — Build JAR then run
mvn clean package -DskipTests
java -jar target/coderunner-0.0.1-SNAPSHOT.jar
```

### Step 5 — Confirm the backend is running

```bash
# Check the port is actually listening
# macOS / Linux:
lsof -i :9090

# Windows:
netstat -ano | findstr :9090
```

You should see a Java process. If nothing appears, Spring Boot crashed on startup —
check the terminal for errors.

```bash
# Quick smoke test — should return JSON, not "connection refused"
curl -X POST http://localhost:9090/api/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"hello\")"}'
```

---

## Part 2 — ngrok Tunnel

> Your phone and your PC are separate devices. The phone has no way to reach
> `localhost` on your PC. ngrok creates a public HTTPS URL that forwards
> traffic from the internet to your local port 9090.

### Step 1 — Install and authenticate ngrok

```bash
# After downloading from https://ngrok.com/download:
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2 — Start the tunnel

```bash
# Use 127.0.0.1 explicitly — NOT localhost
# "localhost" can resolve to ::1 (IPv6) which Spring Boot may not be
# listening on, causing silent 502 errors even though the port is open.
ngrok http 127.0.0.1:9090
```

Your terminal will show:

```
Region          India (in)
Latency         40ms
Web Interface   http://127.0.0.1:4040
Forwarding      https://xxxx-xxxx.ngrok-free.dev -> http://localhost:9090
Connections     ttl=0  opn=0  rt1=0.00
```

Copy that `https://xxxx-xxxx.ngrok-free.dev` URL. You need it in the next part.

> ⚠️ **`ttl=0` is normal at this point** — it counts connections received.
> It will increment when the app makes its first request.

### Step 3 — Verify the tunnel end-to-end with curl

Run this **before** opening the app. If this works, the app will work too.

```bash
curl -X POST https://xxxx-xxxx.ngrok-free.dev/api/execute \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: 1" \
  -d '{"language":"javascript","code":"console.log(\"hello\")"}'
```

**Expected result:** JSON response like `{"output":"hello\n","error":"","exitCode":0}`

After running curl, look at your ngrok terminal — `ttl` should change from `0` to `1`.
If it stays `0`, ngrok can't reach your backend (check Step 5 in Part 1).

---

## Part 3 — React Native App

### Step 1 — Install dependencies

```bash
cd CodeRunner/
npm install
```

### Step 2 — Paste your ngrok URL into `App.tsx`

Open `App.tsx` and update line 14:

```typescript
// BEFORE:
const BACKEND_URL = 'https://YOUR_NEW_LINK.ngrok-free.app/api/execute';

// AFTER — paste your exact URL from ngrok, keep /api/execute at the end:
const BACKEND_URL = 'https://xxxx-xxxx.ngrok-free.dev/api/execute';
```

> ⚠️ Every time you restart ngrok on a free plan, the URL changes.
> You must update this line and restart Metro each time.
> To avoid this: claim a **free static domain** at https://dashboard.ngrok.com/domains

### Step 3 — Confirm the fetch headers are present

In `App.tsx` inside `runCode()`, your fetch must have these 4 headers:

```typescript
const response = await fetch(BACKEND_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',   // ← ngrok free tier injects an HTML
    'User-Agent': 'CodeRunnerApp/1.0',   //   warning page without these two.
  },                                      //   response.json() then crashes on HTML.
  body: JSON.stringify({ language, code: currentCode }),
  signal: controller.signal,
});
```

### Step 4 — Run on Android

```bash
# Make sure an emulator is running in Android Studio, OR
# plug in a physical Android device with USB debugging enabled

npm run android
# or equivalently:
npx react-native run-android
```

### Step 5 — Run on iOS (macOS only)

```bash
# First time only — install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on default simulator
npm run ios
# or:
npx react-native run-ios

# Run on a specific device
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Step 6 — Start Metro bundler manually (if it didn't auto-start)

```bash
npx react-native start

# If you see stale cache errors:
npx react-native start --reset-cache
```

---

## Daily Startup — Quick Reference

Once everything is set up, this is all you need each day.
Open **4 terminal windows** and run one command in each:

```bash
# ── Terminal 1 ── Spring Boot backend
cd coderunner-backend/
./mvnw spring-boot:run


# ── Terminal 2 ── ngrok tunnel
ngrok http 127.0.0.1:9090
# → copy the new https://xxxx.ngrok-free.dev URL


# ── Terminal 3 ── Update App.tsx with new ngrok URL, then start Metro
cd CodeRunner/
npx react-native start


# ── Terminal 4 ── Launch on device
npx react-native run-android    # or run-ios
```

---

## API Reference

The app sends a `POST /api/execute` with this JSON body:

```json
{
  "language": "javascript",
  "code": "console.log('Hello, World!');"
}
```

Valid `language` values: `javascript` · `python` · `java` · `cpp`

Your backend must respond with:

```json
{
  "output": "Hello, World!\n",
  "error": "",
  "exitCode": 0
}
```

The app also accepts `stdout` / `stderr` as field names if your backend uses those instead.

---

## Troubleshooting

### ❌ Network Error / fetch fails silently

**Cause:** Missing ngrok bypass headers — ngrok returned an HTML page, `response.json()` threw.

**Fix:** Confirm your fetch has both:
```typescript
'ngrok-skip-browser-warning': '1',
'User-Agent': 'CodeRunnerApp/1.0',
```

---

### ❌ `ttl=0` — ngrok shows zero connections

**Cause:** The request never left the app. Metro is serving a cached version
of App.tsx that still has the old/placeholder URL.

**Fix:**
```bash
npx react-native start --reset-cache
```
Then rebuild: `npx react-native run-android`

---

### ❌ `502 Bad Gateway` from ngrok

**Cause:** ngrok is running but Spring Boot is not, or is on a different port.

**Fix:**
```bash
# Confirm Java is listening on 9090
lsof -i :9090          # macOS/Linux
netstat -ano | findstr :9090   # Windows

# If nothing — Spring Boot crashed. Check Terminal 1 for the error message.
# Common cause: another process already uses port 9090
```

---

### ❌ CORS error in logs

**Cause:** `ngrok-skip-browser-warning` is not in `allowedHeaders` in your Spring Boot config.

**Fix:** Apply the CorsConfig.java from Part 1 Step 3.

---

### ❌ `Connection refused` on curl to localhost:9090

**Cause:** Spring Boot isn't running, or `server.address` is not `0.0.0.0`.

**Fix:**
```bash
# Check application.properties
cat src/main/resources/application.properties
# Must show: server.address=0.0.0.0

# Then restart backend
./mvnw spring-boot:run
```

---

### ❌ Metro bundler port 8081 already in use

```bash
# macOS / Linux
lsof -ti:8081 | xargs kill -9

# Windows
netstat -ano | findstr :8081
taskkill /PID <PID_FROM_ABOVE> /F

# Then restart
npx react-native start
```

---

### ❌ iOS — pod install fails

```bash
cd ios/
pod deintegrate
pod cache clean --all
pod install
cd ..
npx react-native run-ios
```

---

### ❌ `JAVA_HOME` not set / wrong version

```bash
# macOS — switch to JDK 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Linux
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version    # should show 17.x.x
```

On Windows: open **System Properties → Environment Variables** and set
`JAVA_HOME` to your JDK 17 install path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.x.x`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native |
| Language | TypeScript |
| Code editor | CodeMirror 5.65 (inside WebView) |
| Editor theme | Material Darker |
| Backend framework | Spring Boot 3.x |
| Backend language | Java 17 |
| Tunnel | ngrok |
| Code runtimes | Node.js (JS) · Python 3 · JDK (Java) · GCC (C++) |

---

## License

MIT — see [LICENSE](LICENSE) for details.
