package com.example.code_editor.model;


public class ExecutionResponse {
    private String output;
    private int exitCode;

    public ExecutionResponse(String output, int exitCode) {
        this.output = output;
        this.exitCode = exitCode;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public int getExitCode() {
        return exitCode;
    }

    public void setExitCode(int exitCode) {
        this.exitCode = exitCode;
    }
}