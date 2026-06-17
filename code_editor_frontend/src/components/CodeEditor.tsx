import React, { useImperativeHandle, forwardRef, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface CodeEditorProps {
  language: string;
  initialCode: string;
}

export interface CodeEditorHandle {
  getLatestCode: () => string;
  setFontSize: (size: number) => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({ language, initialCode }, ref) => {
  const webViewRef = useRef<any>(null);
  
  const latestCodeRef = useRef<string>(initialCode);
  const fontSizeRef = useRef<number>(15);


  useImperativeHandle(ref, () => ({
    getLatestCode: () => latestCodeRef.current,
    setFontSize: (size: number) => {
      fontSizeRef.current = size;
      webViewRef.current?.injectJavaScript(
        `document.querySelector('.CodeMirror').style.fontSize = '${size}px'; 
         editor.refresh(); 
         true;`
      );
    },
  }));

  const getEditorMode = (lang: string): string => {
    if (lang === 'python') return 'python';
    if (lang === 'java') return 'text/x-java';
    if (lang === 'cpp') return 'text/x-c++src';
    return 'javascript';
  };

  const safeInitialCode = JSON.stringify(initialCode);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/material-darker.min.css">
      
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/hint/show-hint.min.css">

      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/python/python.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/clike/clike.min.js"></script>
      
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/hint/show-hint.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/hint/anyword-hint.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/hint/javascript-hint.min.js"></script>

      <style>
        * { box-sizing: border-box; }
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          background-color: #0d1117;
          overflow: hidden;
        }
        .CodeMirror {
          height: 100vh !important;
          font-size: 15px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          background: #0d1117 !important;
          color: #e6edf3 !important;
          line-height: 1.6;
          padding-bottom: 40px;
        }
        .CodeMirror-gutters {
          background: #161b22 !important;
          border-right: 1px solid #30363d !important;
          min-width: 46px;
        }
        .CodeMirror-linenumber {
          color: #484f58 !important;
          padding: 0 10px 0 6px !important;
          font-size: 12px;
        }
        .CodeMirror-cursor {
          border-left: 2px solid #58a6ff !important;
        }
        .CodeMirror-selected {
          background: #264f78 !important;
        }
        .CodeMirror-scroll {
          padding-bottom: 60px;
        }
        .CodeMirror-activeline-background {
          background: rgba(88, 166, 255, 0.05) !important;
        }
        /* Style hints overlay to seamlessly blend with your material dark theme */
        .CodeMirror-hints {
          background: #161b22 !important;
          border: 1px solid #30363d !important;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .CodeMirror-hint {
          color: #c9d1d9 !important;
          padding: 6px 10px !important;
          border-radius: 4px;
        }
        li.CodeMirror-hint-active {
          background: #21262d !important;
          color: #58a6ff !important;
        }
      </style>
    </head>
    <body>
      <textarea id="editor" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"></textarea>
      <script>
        var initialCode = ${safeInitialCode};

        var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
          lineNumbers: true,
          theme: "material-darker",
          mode: "${getEditorMode(language)}",
          tabSize: 4,
          indentWithTabs: true,
          lineWrapping: true,
          styleActiveLine: true,
          matchBrackets: true,
          autoCloseBrackets: true,
          inputStyle: "contenteditable",
          // FIX: Tell hint system to fall back on words written in the document if specialized syntax isn't available
          hintOptions: { completeSingle: false }
        });

        editor.setValue(initialCode);

        editor.on("cursorActivity", function(cm) {
          cm.scrollIntoView(null, 80);
        });

        // FIX: Fire autocomplete popup dynamically as the developer types
        editor.on("inputRead", function(cm, changeObj) {
          // Only trigger if typing letters, digits, or scope access dots
          if (changeObj.origin === "+input" && /^[a-zA-Z0-9_\.]$/.test(changeObj.text[0])) {
            cm.showHint({ completeSingle: false });
          }
        });

        editor.on("change", function() {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "codeChange", value: editor.getValue() })
          );
        });

        editor.focus();
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const mode = getEditorMode(language);
    const injectedJs = `editor.setOption("mode", "${mode}"); true;`;
    webViewRef.current?.injectJavaScript(injectedJs);
  }, [language]);

  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'codeChange') {
        latestCodeRef.current = msg.value;
      }
    } catch {
      latestCodeRef.current = event.nativeEvent.data;
    }
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        style={styles.webview}
        backgroundColor="#0d1117"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  webview: { flex: 1, backgroundColor: '#0d1117' },
});

export default CodeEditor;