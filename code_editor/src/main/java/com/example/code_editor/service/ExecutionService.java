package com.example.code_editor.service;
import com.example.code_editor.model.ExecutionResponse;

public interface ExecutionService {
    ExecutionResponse execute(String language, String code) throws Exception;
}