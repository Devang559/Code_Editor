package com.example.code_editor.service;

import com.example.code_editor.model.ExecutionResponse;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;

@Service
public class NodeExecutionService implements ExecutionService {

    @Override
    public ExecutionResponse execute(String language, String code) throws Exception {
        // Create a unique working directory for this specific execution to avoid file name collisions
        File workingDir = Files.createTempDirectory("editor-run-").toFile();
        File sourceFile = null;
        File outputFile = null;

        try {
            ProcessBuilder pb = null;

            switch (language.toLowerCase()) {
                case "javascript":
                    sourceFile = new File(workingDir, "script.js");
                    Files.writeString(sourceFile.toPath(), code);
                    pb = new ProcessBuilder("node", sourceFile.getName());
                    break;

                case "python":
                    sourceFile = new File(workingDir, "script.py");
                    Files.writeString(sourceFile.toPath(), code);
                    // Note: Depending on your OS setup, you might need "python3" instead of "python"
                    pb = new ProcessBuilder("python", sourceFile.getName());
                    break;

                case "java":
                    // Java requires the file name to match the public class name.

                    sourceFile = new File(workingDir, "Main.java");
                    Files.writeString(sourceFile.toPath(), code);

                    // Step 1: Compile Main.java
                    ExecutionResponse compilationJavaResult = runProcess(
                            new ProcessBuilder("javac", sourceFile.getName()).directory(workingDir), 5
                    );
                    if (compilationJavaResult.getExitCode() != 0) {
                        return new ExecutionResponse("Compilation Error:\n" + compilationJavaResult.getOutput(), compilationJavaResult.getExitCode());
                    }

                    // Step 2: Set up execution command for Java
                    pb = new ProcessBuilder("java", "Main");
                    break;

                case "cpp":
                case "c++":
                    sourceFile = new File(workingDir, "program.cpp");
                    Files.writeString(sourceFile.toPath(), code);

                    // Name the output executable based on OS
                    String exeName = System.getProperty("os.name").toLowerCase().contains("win") ? "program.exe" : "./program.out";
                    outputFile = new File(workingDir, exeName);

                    // Step 1: Compile C++ code using g++
                    pb = new ProcessBuilder("g++", sourceFile.getName(), "-o", exeName);
                    ExecutionResponse compilationCppResult = runProcess(pb.directory(workingDir), 7);
                    if (compilationCppResult.getExitCode() != 0) {
                        return new ExecutionResponse("Compilation Error:\n" + compilationCppResult.getOutput(), compilationCppResult.getExitCode());
                    }

                    // Step 2: Set up execution command for the compiled binary
                    pb = new ProcessBuilder(exeName);
                    break;

                default:
                    return new ExecutionResponse("Error: Unsupported execution language '" + language + "'.", -1);
            }

            // Set the working directory for the process execution so it locates the local files smoothly
            pb.directory(workingDir);

            // Execute the code and return results
            return runProcess(pb, 5);

        } finally {
            // Recursive cleanup of the temporary directory and all files inside it
            cleanUpDirectory(workingDir);
        }
    }

    /**
     * Helper method to handle process lifetime, streams, and timeout constraints.
     */
    private ExecutionResponse runProcess(ProcessBuilder pb, int timeoutSeconds) throws Exception {
        Process process = pb.start();

        // 5-second timeout guard to intercept infinite loops
        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            return new ExecutionResponse("Error: Execution timed out (Maximum " + timeoutSeconds + " seconds allowed).", -1);
        }

        StringBuilder outputLog = new StringBuilder();
        try (BufferedReader stdInput = new BufferedReader(new InputStreamReader(process.getInputStream()));
             BufferedReader stdError = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {

            String s;
            while ((s = stdInput.readLine()) != null) {
                outputLog.append(s).append("\n");
            }
            while ((s = stdError.readLine()) != null) {
                outputLog.append(s).append("\n");
            }
        }

        return new ExecutionResponse(outputLog.toString().trim(), process.exitValue());
    }

    private void cleanUpDirectory(File directory) {
        if (directory != null && directory.exists()) {
            File[] allContents = directory.listFiles();
            if (allContents != null) {
                for (File file : allContents) {
                    file.delete();
                }
            }
            directory.delete();
        }
    }
}