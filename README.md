# ⚡ CodeRunner

A mobile code editor built with **React Native** and **Spring Boot** that allows users to write and execute **JavaScript, Python, Java, and C++** code directly from their phone. The app provides syntax highlighting, live terminal output, and seamless backend communication through ngrok.

---

## 🚀 Features

- 🖊️ Code editor with syntax highlighting using CodeMirror
- 🌐 Supports JavaScript, Python, Java, and C++
- ▶️ Execute code on a Spring Boot backend
- 🖥️ Real-time terminal output (stdout & stderr)
- 🔍 Adjustable editor font size
- 📱 Cross-platform (Android & iOS)
- 🔒 Secure backend connectivity using ngrok

---

## 🛠️ Tech Stack

| Layer | Technology |
|---------|------------|
| Mobile App | React Native |
| Language | TypeScript |
| Code Editor | CodeMirror 5 |
| Backend | Spring Boot 3 |
| Backend Language | Java 17 |
| Code Execution | Node.js, Python, Java, GCC/G++ |
| Tunnel | ngrok |

---

## 📂 Project Structure

```text
CodeRunner/
├── App.tsx
├── src/
│   └── components/
│       ├── CodeEditor.tsx
│       └── ConsoleOutput.tsx
├── android/
├── ios/
└── package.json

code_editor/
├── controller/
├── service/
├── model/
└── application.properties
```

---

## ⚙️ Prerequisites

### Frontend

- npm
- React Native expo
- Android Studio
- JDK 17+

### Backend
- Java 17+
- Maven
- Node.js
- Python 3
- GCC/G++

### Tunnel
- ngrok

---

## 🚀 Backend Setup

```bash
cd code_editor
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:9090
```

---

## 🌐 Start ngrok

Expose the local backend:

```bash
 npx ngrok http 127.0.0.1:9090
```

Copy the generated URL:

```text
https://xxxx.ngrok-free.dev
```

Update your React Native app:

```ts
const BACKEND_URL =
  "https://xxxx.ngrok-free.dev/api/execute";
```

---

## 📱 Frontend Setup

Install dependencies:

```bash
cd CodeRunner
npm install
```

Start Metro:

```bash
npx react-native start
```

Run Android:

```bash
npx react-native run-android
```

Run iOS:

```bash
npx react-native run-ios
```

---

## 🔌 API Reference

### Request

```json
{
  "language": "javascript",
  "code": "console.log('Hello World');"
}
```

Supported languages:

- javascript
- python
- java
- cpp

### Response

```json
{
  "output": "Hello World\n",
  "error": "",
  "exitCode": 0
}
```

---

## 🎯 How It Works

```text
React Native App
        │
        ▼
   ngrok Tunnel
        │
        ▼
 Spring Boot API
        │
        ▼
 Language Executors
(Node.js / Python / Java / C++)
        │
        ▼
 Terminal Output
```

---

## 📸 Highlights

- Multi-language code execution
- Live console output
- Mobile-friendly coding experience
- Adjustable font size
- Clean dark-theme editor
- Spring Boot powered execution engine

---



---

### 👨‍💻 Author

Developed as a full-stack mobile application using React Native, TypeScript, Spring Boot, and ngrok for remote code execution.
<img width="134" height="278" alt="Image" src="https://github.com/user-attachments/assets/2f054f80-8be2-4455-96e8-86aa9fd6b577" />
<img width="134" height="278" alt="Image" src="https://github.com/user-attachments/assets/5d91d8c7-2789-447b-8136-a8e6defc7742" />
<img width="134" height="278" alt="Image" src="https://github.com/user-attachments/assets/87ea0a63-10d6-49bb-bd8f-837a81d37f7c" />
<img width="134" height="278" alt="Image" src="https://github.com/user-attachments/assets/307db58b-108b-4ba4-884c-a30077e5e571" />
