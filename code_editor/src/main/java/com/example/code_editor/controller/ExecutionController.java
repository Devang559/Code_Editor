package com.example.code_editor.controller;

import com.example.code_editor.model.ExecutionRequest;
import com.example.code_editor.model.ExecutionResponse;
import com.example.code_editor.service.ExecutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(
        origins = "*",
        allowedHeaders = {
                "Content-Type", "Accept",
                "ngrok-skip-browser-warning",
                "User-Agent"
        },
        methods = { RequestMethod.POST, RequestMethod.OPTIONS }
)
public class ExecutionController {

    private final ExecutionService executionService;

    // A quick-lookup set of our newly supported languages
    private static final Set<String> SUPPORTED_LANGUAGES = Set.of("javascript", "python", "java", "cpp", "c++");

    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping
    public ResponseEntity<ExecutionResponse> runCode(@RequestBody ExecutionRequest request) {

        // 1. Validate that both fields exist
        if (request.getLanguage() == null || request.getCode() == null) {
            return ResponseEntity.badRequest()
                    .body(new ExecutionResponse("Error: 'language' and 'code' fields are required.", -1));
        }

        // 2. Validate against our supported runtime matrix
        String language = request.getLanguage().toLowerCase().trim();
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            return ResponseEntity.badRequest()
                    .body(new ExecutionResponse("Error: Unsupported language '" + request.getLanguage() +
                            "'. Supported: JavaScript, Python, Java, C++", -1));
        }

        try {
            // 3. Forward BOTH the language and code payload to the service
            ExecutionResponse response = executionService.execute(language, request.getCode());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ExecutionResponse("Server Error running compilation pipeline: " + e.getMessage(), 500));
        }
    }
}