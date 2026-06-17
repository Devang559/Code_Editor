import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, ScrollView, View, TouchableOpacity } from 'react-native';

interface ConsoleOutputProps {
  output: string;
  onClear?: () => void;
}

export default function ConsoleOutput({ output, onClear }: ConsoleOutputProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (output) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [output]);

  // Determine output line color based on content
  const getLineStyle = (line: string) => {
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception') || line.toLowerCase().includes('traceback')) {
      return styles.errorText;
    }
    if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')) {
      return styles.warnText;
    }
    if (line.startsWith('//') || line.startsWith('#')) {
      return styles.commentText;
    }
    return styles.outputText;
  };

  const lines = output ? output.split('\n') : [];
  const isIdle = !output;
  const isCompiling = output === 'Compiling and executing on server...';

  return (
    <View style={styles.wrapper}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Terminal traffic lights */}
          <View style={[styles.dot, { backgroundColor: '#ff5f57' }]} />
          <View style={[styles.dot, { backgroundColor: '#febc2e' }]} />
          <View style={[styles.dot, { backgroundColor: '#28c840' }]} />
          <Text style={styles.headerTitle}>TERMINAL</Text>
        </View>
        {output && onClear && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Output area */}
      <ScrollView
        ref={scrollRef}
        style={styles.terminal}
        contentContainerStyle={styles.terminalContent}
        showsVerticalScrollIndicator={false}
      >
        {isIdle ? (
          <View style={styles.idleContainer}>
            <Text style={styles.idlePrompt}>{'>'}</Text>
            <Text style={styles.idleText}> Terminal idle — tap </Text>
            <Text style={styles.idleRun}>RUN</Text>
            <Text style={styles.idleText}> to execute</Text>
          </View>
        ) : isCompiling ? (
          <View style={styles.compilingRow}>
            <Text style={styles.compilingDot}>⬤ </Text>
            <Text style={styles.compilingText}>{output}</Text>
          </View>
        ) : (
          <>
            <View style={styles.promptRow}>
              <Text style={styles.prompt}>$ run</Text>
            </View>
            {lines.map((line, i) => (
              <Text key={i} style={[styles.baseText, getLineStyle(line)]}>
                {line || ' '}
              </Text>
            ))}
            <View style={styles.cursorRow}>
              <Text style={styles.cursor}>█</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 200,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    color: '#484f58',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  clearText: {
    color: '#484f58',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  terminal: {
    flex: 1,
  },
  terminalContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  idleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idlePrompt: {
    color: '#58a6ff',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  idleText: {
    color: '#484f58',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  idleRun: {
    color: '#3fb950',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  compilingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compilingDot: {
    color: '#f0883e',
    fontSize: 10,
    // Ideally animated, but kept simple
  },
  compilingText: {
    color: '#f0883e',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  promptRow: {
    marginBottom: 6,
  },
  prompt: {
    color: '#3fb950',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  baseText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  outputText: {
    color: '#e6edf3',
  },
  errorText: {
    color: '#f85149',
  },
  warnText: {
    color: '#f0883e',
  },
  commentText: {
    color: '#8b949e',
  },
  cursorRow: {
    marginTop: 4,
  },
  cursor: {
    color: '#58a6ff',
    fontSize: 12,
    opacity: 0.8,
  },
});