package com.knowledgesystem.controller;

import com.knowledgesystem.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Tag(name = "系统配置", description = "主题设置、全局配置等接口")
@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    private final SystemConfigService systemConfigService;

    public ConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @Operation(summary = "获取当前主题", description = "获取系统当前设置的主题（light/dark）")
    @GetMapping("/theme")
    public ResponseEntity<Result<String>> getTheme() {
        try {
            String theme = systemConfigService.getTheme();
            return ResponseEntity.ok(Result.success(theme));
        } catch (RuntimeException e) {
            log.error("Failed to get theme", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "设置主题", description = "设置系统主题（light/dark）")
    @PutMapping("/theme")
    public ResponseEntity<Result<Boolean>> setTheme(
            @Parameter(description = "主题值：light 或 dark")
            @RequestBody Map<String, String> request) {
        try {
            String theme = request.get("theme");
            if (theme == null || theme.isEmpty()) {
                return ResponseEntity.badRequest().body(Result.error("Theme value is required"));
            }
            systemConfigService.setTheme(theme);
            log.info("Theme updated to: {}", theme);
            return ResponseEntity.ok(Result.success(true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Failed to set theme", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取所有公开配置", description = "获取所有公开的系统配置项")
    @GetMapping("/public")
    public ResponseEntity<Result<Map<String, String>>> getPublicConfigs() {
        try {
            Map<String, String> configs = new HashMap<>();
            configs.put("theme", systemConfigService.getTheme());
            return ResponseEntity.ok(Result.success(configs));
        } catch (RuntimeException e) {
            log.error("Failed to get public configs", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Result<T> {
        private Integer code;
        private String message;
        private T data;

        public static <T> Result<T> success(T data) {
            return new Result<>(200, "操作成功", data);
        }

        public static <T> Result<T> error(String message) {
            return new Result<>(400, message, null);
        }
    }
}
