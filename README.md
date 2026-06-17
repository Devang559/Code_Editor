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
| 🖥️ Terminal Output | Color-coded console — errors in red, warnings in orange, output in white |
| 🔒 ngrok Tunnel | Securely connects your phone to your local PC backend over HTTPS |

---

## Project Structure

```
CodeRunner/                              ← React Native App
├── App.tsx                              ← Root: fetch logic, language tabs, zoom
├── src/
│   └── components/
│       ├── CodeEditor.tsx               ← WebView + CodeMirror editor
│       └── ConsoleOutput.tsx            ← Terminal display with auto-scroll
├── android/
├── ios/
├── package.json
└── README.md

code_editor/                             ← Spring Boot Backend
└── src/
    └── main/
        ├── java/
        │   └── com/example/code_editor/
        │       ├── CodeEditorApplication.java      ← Entry point (@SpringBootApplication)
        │       ├── controller/
        │       │   └── ExecutionController.java    ← POST /api/execute
        │       ├── model/
        │       │   ├── ExecutionRequest.java       ← { language, code }
        │       │   └── ExecutionResponse.java      ← { output, error, exitCode }
        │       └── service/
        │           ├── ExecutionService.java       ← Routes to the right executor
        │           └── NodeExecutionService.java   ← Handles JS via Node.js subprocess
        └── resources/
            └── application.properties             ← port=9090, address=0.0.0.0
```

---

## Prerequisites

Install **everything** in this table before starting.

### React Native App

| Tool | Min Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Bundled with Node.js |
| React Native CLI | Latest | `npm install -g react-native-cli` |
| Android Studio | Latest | https://developer.android.com/studio |
| JDK | 17+ | https://adoptium.net |
| Watchman *(macOS only)* | Latest | `brew install watchman` |

### Spring Boot Backend (`code_editor`)

| Tool | Why It's Needed | Install |
|---|---|---|
| JDK | 17+ | Runs Spring Boot itself | https://adoptium.net |
| Maven | 3.8+ | Builds the project | https://maven.apache.org |
| Node.js | 18+ | `NodeExecutionService` uses it to run JS code | https://nodejs.org |
| Python | 3.8+ | `ExecutionService` spawns `python3` for Python code | https://python.org |
| GCC / G++ | Any | Compiles and runs C++ code | Pre-installed on Linux/macOS; Windows: install MinGW |

### Tunnel

| Tool | Install |
|---|---|
| ngrok | https://ngrok.com/download — free account required |

---

## How It All Connects

```
 ┌──────────────────────────────────┐
 │       Your Phone / Emulator      │
 │                                  │
 │   ┌──────────────────────────┐   │
 │   │   CodeMirror Editor      │   │
 │   │   (inside WebView)       │   │
 │   └──────────────────────────┘   │
 │                                  │
 │        [ ▶  RUN CODE ]           │
 │                                  │
 │   ┌──────────────────────────┐   │
 │   │  TERMINAL                │   │
 │   │  $ run                   │   │
 │   │  Hello, World! ▋         │   │
 │   └──────────────────────────┘   │
 └───────────────┬──────────────────┘
                 │
                 │  HTTPS POST /api/execute
                 │  ngrok-skip-browser-warning: 1
                 │  User-Agent: CodeRunnerApp/1.0
                 ▼
 ┌──────────────────────────────────┐
 │          ngrok Tunnel            │
 │   https://xxxx.ngrok-free.dev    │
 │       → http://localhost:9090    │
 └───────────────┬──────────────────┘
                 │
                 ▼
 ┌──────────────────────────────────┐
 │   Spring Boot  :9090             │
 │   com.example.code_editor        │
 │                                  │
 │   ExecutionController            │
 │     POST /api/execute            │
 │          │                       │
 │          ▼                       │
 │   ExecutionService               │
 │     routes by language           │
 │          │                       │
 │    ┌─────┴──────┐                │
 │    ▼            ▼                │
 │  NodeExecution  python/java/g++  │
 │  Service        subprocess       │
 │    │                             │
 │    └──→ stdout/stderr → JSON ───→│
 └──────────────────────────────────┘
```

---

## Part 1 — Spring Boot Backend

### Step 1 — Open the project

Open the `code_editor/` folder in **IntelliJ IDEA** (recommended) or any IDE.
The project root is where `pom.xml` lives.

### Step 2 — Verify `application.properties`

Open `src/main/resources/application.properties`:

```properties
server.port=9090
server.address=0.0.0.0
```

> `0.0.0.0` is required. If this says `localhost` or `127.0.0.1`,
> ngrok will get a 502 error even though Spring Boot is running.

### Step 3 — Fix CORS in `ExecutionController.java`

`@CrossOrigin(origins = "*")` alone **is not enough** — it does not allow the
`ngrok-skip-browser-warning` header, so ngrok's preflight OPTIONS check silently
rejects every request before it reaches your controller code.

**Option A — Add a global config class (recommended):**

Create a new file at `src/main/java/com/example/code_editor/config/CorsConfig.java`:

```java
package com.example.code_editor.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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
                "ngrok-skip-browser-warning"   // ← THIS is the critical missing header
            )
            .maxAge(3600);
    }
}
```

Then remove `@CrossOrigin` from `ExecutionController.java` entirely.

**Option B — Fix the annotation directly on `ExecutionController.java`:**

```java
// Replace your existing @CrossOrigin with this:
@CrossOrigin(
    origins = "*",
    allowedHeaders = {
        "Content-Type",
        "Accept",
        "User-Agent",
        "ngrok-skip-browser-warning"           // ← must be listed explicitly
    },
    methods = { RequestMethod.POST, RequestMethod.OPTIONS }
)
@PostMapping("/api/execute")
public ResponseEntity<ExecutionResponse> execute(
        @RequestBody ExecutionRequest request) {
    // your existing code
}
```

### Step 4 — Verify your model classes match the app's expected JSON

`ExecutionRequest.java` must have these two fields:

```java
package com.example.code_editor.model;

public class ExecutionRequest {
    private String language;   // "javascript" | "python" | "java" | "cpp"
    private String code;       // the raw source code string

    // getters and setters
}
```

`ExecutionResponse.java` must have these fields:

```java
package com.example.code_editor.model;

public class ExecutionResponse {
    private String output;     // stdout from the subprocess
    private String error;      // stderr from the subprocess
    private int exitCode;      // 0 = success

    // getters and setters
}
```

### Step 5 — Build and run

```bash
cd code_editor/

# Option A — Maven wrapper (no Maven install required)
./mvnw spring-boot:run

# Option B — System Maven
mvn spring-boot:run

# Option C — Build JAR first, then run
mvn clean package -DskipTests
java -jar target/code_editor-0.0.1-SNAPSHOT.jar
```

### Step 6 — Confirm the backend is working

```bash
# Check that Java is actually listening on port 9090
# macOS / Linux:
lsof -i :9090

# Windows:
netstat -ano | findstr :9090
```

You should see a Java process. If nothing appears, Spring Boot crashed —
look at the terminal output for the error.

```bash
# Direct smoke test — must return JSON, not "connection refused"
curl -X POST http://localhost:9090/api/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"hello\")"}'

# Expected response:
# {"output":"hello\n","error":"","exitCode":0}
```

---

## Part 2 — ngrok Tunnel

> Your phone cannot reach `localhost` on your PC.
> ngrok creates a public HTTPS URL that forwards traffic to your port 9090.

### Step 1 — Install and authenticate

```bash
# After downloading from https://ngrok.com/download:
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2 — Start the tunnel

```bash
# Use 127.0.0.1 explicitly — NOT just "localhost"
# "localhost" can silently resolve to ::1 (IPv6) which Spring Boot
# may not be bound to, giving you 502 errors with no obvious cause.
ngrok http 127.0.0.1:9090
```

You will see:

```
Region          India (in)
Latency         40ms
Web Interface   http://127.0.0.1:4040
Forwarding      https://xxxx-xxxx.ngrok-free.dev -> http://localhost:9090
Connections     ttl=0  opn=0  rt1=0.00  rt5=0.00
```

Copy the `https://xxxx-xxxx.ngrok-free.dev` URL — you need it in Part 3.

> `ttl=0` is normal here. It counts requests received. It will go to 1
> when the app makes its first successful call.

### Step 3 — Test the tunnel with curl before touching the app

```bash
curl -X POST https://xxxx-xxxx.ngrok-free.dev/api/execute \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: 1" \
  -d '{"language":"javascript","code":"console.log(\"hello\")"}'
```

After running this, check your ngrok terminal — `ttl` must go from `0` to `1`.

| curl result | Meaning | Fix |
|---|---|---|
| JSON response ✅ | Everything works | Proceed to Part 3 |
| HTML page | ngrok interstitial (headers missing) | Add headers in Part 3 Step 3 |
| `502 Bad Gateway` | Spring Boot unreachable | Check Part 1 Step 2 (`server.address`) |
| `connection refused` | Spring Boot not running | Run `./mvnw spring-boot:run` |
| `CORS error` | `allowedHeaders` missing | Apply CorsConfig from Part 1 Step 3 |

---

## Part 3 — React Native App

### Step 1 — Install dependencies

```bash
cd CodeRunner/
npm install
```

### Step 2 — Paste your ngrok URL into `App.tsx`

Open `App.tsx` and update the `BACKEND_URL` constant at the top:

```typescript
// BEFORE (placeholder — will never work):
const BACKEND_URL = 'https://YOUR_NEW_LINK.ngrok-free.app/api/execute';

// AFTER — your real ngrok URL from Part 2 Step 2:
const BACKEND_URL = 'https://xxxx-xxxx.ngrok-free.dev/api/execute';
//                                                    ^^^^
//                              note: .dev not .app — match exactly what ngrok gave you
```

> ⚠️ Every time you restart ngrok on the free plan, the URL changes and
> you must update this line. To get a permanent URL, claim a free static
> domain at https://dashboard.ngrok.com/domains

### Step 3 — Confirm the fetch has all 4 required headers

In `App.tsx` inside the `runCode` function, your fetch call must look like this:

```typescript
const response = await fetch(BACKEND_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',   // Without this, ngrok returns an HTML
    'User-Agent': 'CodeRunnerApp/1.0',   // warning page instead of your JSON.
  },                                      // response.json() then throws silently.
  body: JSON.stringify({ language, code: currentCode }),
  signal: controller.signal,
});
```

### Step 4 — Run on Android

```bash
# Start an Android emulator via Android Studio first, OR
# plug in a physical device with USB Debugging enabled

npm run android
# or:
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

### Step 6 — Start Metro bundler (if it didn't auto-start)

```bash
npx react-native start

# If you get cache/stale build errors:
npx react-native start --reset-cache
```

---

## Daily Startup — Quick Reference

Open 4 terminal windows and run one command in each, in order:

```bash
# ── Terminal 1 ── Start Spring Boot
cd code_editor/
./mvnw spring-boot:run


# ── Terminal 2 ── Start ngrok tunnel
ngrok http 127.0.0.1:9090
# Copy the new https://xxxx.ngrok-free.dev URL


# ── Update App.tsx ── Paste the URL into BACKEND_URL and save the file


# ── Terminal 3 ── Start Metro bundler
cd CodeRunner/
npx react-native start


# ── Terminal 4 ── Launch on device
npx react-native run-android
# or
npx react-native run-ios
```

---

## API Reference

**Request** — `POST /api/execute`

```json
{
  "language": "javascript",
  "code": "console.log('Hello, World!');"
}
```

Valid `language` values: `javascript` · `python` · `java` · `cpp`

**Response**

```json
{
  "output": "Hello, World!\n",
  "error": "",
  "exitCode": 0
}
```

The app also accepts `stdout` / `stderr` as field names if your `ExecutionResponse`
uses those instead of `output` / `error`.

---

## Troubleshooting

### ❌ Fetch fails / Network Error with no details

The most common cause. ngrok returned an HTML warning page and `response.json()` crashed.

**Fix:** Add these headers to your fetch call in `App.tsx`:
```typescript
'ngrok-skip-browser-warning': '1',
'User-Agent': 'CodeRunnerApp/1.0',
```

---

### ❌ `ttl=0` — ngrok shows zero connections after tapping Run

The request never left the app. Metro is serving a cached build with the old URL.

**Fix:**
```bash
npx react-native start --reset-cache
npx react-native run-android
```

Also double-check `BACKEND_URL` in `App.tsx` — it must not still say `YOUR_NEW_LINK`.

---

### ❌ `502 Bad Gateway` from ngrok

ngrok is running but can't reach Spring Boot.

**Fix:**
```bash
# 1. Confirm Spring Boot is on port 9090
lsof -i :9090          # macOS / Linux
netstat -ano | findstr :9090   # Windows

# 2. Confirm application.properties has:
#    server.address=0.0.0.0   ← NOT localhost

# 3. Restart ngrok with explicit IP:
ngrok http 127.0.0.1:9090
```

---

### ❌ CORS error / preflight blocked

`ngrok-skip-browser-warning` is not in `allowedHeaders`.

**Fix:** Add `CorsConfig.java` from Part 1 Step 3.
The `@CrossOrigin(origins = "*")` annotation alone does **not** allow custom headers.

---

### ❌ `NodeExecutionService` fails to run JavaScript

Node.js is not installed or not on the system PATH that Spring Boot sees.

**Fix:**
```bash
# Confirm node is accessible
node --version   # must print v18.x or higher

# On Windows, restart IntelliJ/terminal after installing Node
# so the PATH update takes effect
```

---

### ❌ Metro bundler port 8081 already in use

```bash
# macOS / Linux
lsof -ti:8081 | xargs kill -9

# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Then restart Metro
npx react-native start
```

---

### ❌ iOS build fails — pod install error

```bash
cd ios/
pod deintegrate
pod cache clean --all
pod install
cd ..
npx react-native run-ios
```

---

### ❌ `JAVA_HOME` not set or wrong version

```bash
# macOS
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Linux
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Confirm
java -version    # must show 17.x.x
```

On Windows: **System Properties → Environment Variables → New**
- Variable name: `JAVA_HOME`
- Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | React Native |
| Language | TypeScript |
| Code editor | CodeMirror 5.65 (inside WebView) |
| Editor theme | Material Darker |
| Backend framework | Spring Boot 3.x |
| Backend package | `com.example.code_editor` |
| Backend language | Java 17 |
| Tunnel | ngrok |
| JS execution | `NodeExecutionService` → Node.js subprocess |
| Python/Java/C++ | `ExecutionService` → language subprocess |

---

## License

MIT — see [LICENSE](LICENSE) for details.
