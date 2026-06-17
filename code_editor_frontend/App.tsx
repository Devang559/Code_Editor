import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import CodeEditor, { CodeEditorHandle } from './src/components/CodeEditor';
import ConsoleOutput from './src/components/ConsoleOutput';

// ─── Config ────────────────────────────────────────────────────────────────────
const BACKEND_URL = 'https://propeller-thorn-uninvited.ngrok-free.dev/api/execute';
//                    

const MIN_FONT_SIZE = 11;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 15;

// ─── Boilerplates ──────────────────────────────────────────────────────────────
const BOILERPLATES: Record<string, string> = {
  javascript: `// JavaScript\nconsole.log("Hello from JavaScript!");\n\nconst greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("World"));`,
  python: `# Python\nprint("Hello from Python!")\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  java: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n\n        String name = "World";\n        System.out.println("Hello, " + name + "!");\n    }\n}`,
  cpp: `// C++\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n\n    string name = "World";\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}`,
};

// Language display metadata
const LANG_META: Record<string, { label: string; color: string; icon: string }> = {
  javascript: { label: 'JS',   color: '#f0db4f', icon: '⚡' },
  python:     { label: 'PY',   color: '#3572A5', icon: '🐍' },
  java:       { label: 'JAVA', color: '#b07219', icon: '☕' },
  cpp:        { label: 'C++',  color: '#f34b7d', icon: '⚙️'  },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const [language, setLanguage] = useState<string>('javascript');
  const [output, setOutput]     = useState<string>('');
  const [loading, setLoading]   = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);

  const editorRef = useRef<CodeEditorHandle>(null);

  // ── Language switch ──────────────────────────────────────────────────────────
  const handleLanguageChange = (lang: string) => {
    if (lang === language) return;
    setLanguage(lang);
    setOutput('');
  };

  // ── Zoom controls ────────────────────────────────────────────────────────────
  const handleZoomIn = () => {
    const next = Math.min(fontSize + 2, MAX_FONT_SIZE);
    setFontSize(next);
    editorRef.current?.setFontSize(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(fontSize - 2, MIN_FONT_SIZE);
    setFontSize(next);
    editorRef.current?.setFontSize(next);
  };

  // ── Run code ─────────────────────────────────────────────────────────────────
  const runCode = async () => {
    const currentCode = editorRef.current?.getLatestCode() ?? BOILERPLATES[language];

    setLoading(true);
    setOutput('Compiling and executing on server...');

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',  // Official ngrok bypass header
          'User-Agent': 'CodeRunnerApp/1.0',  // Non-browser agent = no interstitial
          // ────────────────────────────────────────────────────────────────────
        },
        body: JSON.stringify({ language, code: currentCode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        setOutput(`Server error ${response.status}:\n${errText.slice(0, 300)}`);
        return;
      }

      const data = await response.json();

      const stdout   = data.output ?? data.stdout ?? '';
      const stderr   = data.error  ?? data.stderr  ?? '';
      const exitCode = data.exitCode ?? data.exit_code ?? 0;

      if (stderr && !stdout) {
        setOutput(stderr);
      } else if (stdout && stderr) {
        setOutput(`${stdout}\n\n[stderr]\n${stderr}`);
      } else if (stdout) {
        setOutput(stdout);
      } else {
        setOutput(`Process exited with code ${exitCode}`);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setOutput(
          `Request timed out after 15 seconds.\n\nPossible causes:\n` +
          `  • Spring Boot not running on port 9090\n` +
          `  • ngrok not running  →  start it: ngrok http 9090\n` +
          `  • Wrong ngrok URL in BACKEND_URL`
        );
      } else {
        setOutput(
          `Network Error: ${err.message}\n\n` +
          `Checklist:\n` +
          `  • Is Spring Boot running on port 9090?\n` +
          `  • Is ngrok running?  →  ngrok http 9090\n` +
          `  • Did you paste your ngrok URL into BACKEND_URL?\n` +
          `  • Current URL: ${BACKEND_URL}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const meta = LANG_META[language];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117"
      translucent={true} 
      animated={false}
      hidden={true}
      
       />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.appIcon}>{'</>'}</Text>
          <Text style={styles.appTitle}>CodeRunner</Text>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[styles.zoomBtn, fontSize <= MIN_FONT_SIZE && styles.zoomBtnDisabled]}
            onPress={handleZoomOut}
            disabled={fontSize <= MIN_FONT_SIZE}
          >
            <Text style={styles.zoomIcon}>A−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomLabel}>{fontSize}px</Text>
          <TouchableOpacity
            style={[styles.zoomBtn, fontSize >= MAX_FONT_SIZE && styles.zoomBtnDisabled]}
            onPress={handleZoomIn}
            disabled={fontSize >= MAX_FONT_SIZE}
          >
            <Text style={styles.zoomIcon}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Language tabs ─────────────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {Object.keys(BOILERPLATES).map((lang) => {
          const m = LANG_META[lang];
          const active = language === lang;
          return (
            <TouchableOpacity
              key={lang}
              style={[styles.tabButton, active && styles.activeTab]}
              onPress={() => handleLanguageChange(lang)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{m.icon}</Text>
              <Text style={[styles.tabText, active && { color: m.color }]}>
                {m.label}
              </Text>
              {active && (
                <View style={[styles.tabIndicator, { backgroundColor: m.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

     {/* ── Editor ────────────────────────────────────────────────────────── */}
<View style={styles.editorContainer}>
  {/* File name pill */}
  <View style={styles.fileBar}>
    <View style={[styles.fileDot, { backgroundColor: meta.color }]} />
    <Text style={styles.fileName}>
      {language === 'javascript' ? 'index.js'
        : language === 'python'  ? 'main.py'
        : language === 'java'    ? 'Main.java'
        : 'main.cpp'}
    </Text>
  </View>

 
  <CodeEditor
    key={language}   
    ref={editorRef}
    language={language}
    initialCode={BOILERPLATES[language]} 
  />
</View>

      {/* ── Run button ────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.runButton, loading && styles.runButtonLoading]}
        onPress={runCode}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <View style={styles.runButtonInner}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.runButtonText}>EXECUTING...</Text>
          </View>
        ) : (
          <View style={styles.runButtonInner}>
            <Text style={styles.runButtonIcon}>▶</Text>
            <Text style={styles.runButtonText}>RUN CODE</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Console ───────────────────────────────────────────────────────── */}
      <ConsoleOutput
        output={output}
        onClear={() => setOutput('')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appIcon: {
    color: '#58a6ff',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  appTitle: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Zoom
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomBtn: {
    width: 34,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnDisabled: {
    opacity: 0.35,
  },
  zoomIcon: {
    color: '#e6edf3',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  zoomLabel: {
    color: '#58a6ff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    minWidth: 36,
    textAlign: 'center',
  },

  // Language tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 3,
  },
  activeTab: {
    backgroundColor: '#161b22',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    color: '#484f58',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 1,
  },

  // Editor container
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  fileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
    gap: 7,
  },
  fileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fileName: {
    color: '#8b949e',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Run button
  runButton: {
    backgroundColor: '#238636',
    paddingVertical: 13,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ea043',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  runButtonLoading: {
    backgroundColor: '#1a6626',
  },
  runButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runButtonIcon: {
    color: '#fff',
    fontSize: 12,
  },
  runButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
});