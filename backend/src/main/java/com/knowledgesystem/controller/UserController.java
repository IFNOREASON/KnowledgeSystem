package com.knowledgesystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgesystem.entity.User;
import com.knowledgesystem.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Tag(name = "用户管理", description = "用户信息查询、更新、数据清理、数据导出接口")
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final ObjectMapper objectMapper;

    public UserController(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "获取用户信息", description = "根据用户ID获取用户详细信息")
    @GetMapping("/{id}")
    public ResponseEntity<Result<User>> getUserInfo(
            @Parameter(description = "用户ID")
            @PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            if (user != null) {
                user.setPassword(null);
            }
            return ResponseEntity.ok(Result.success(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "更新用户信息", description = "更新用户个人信息")
    @PutMapping("/{id}")
    public ResponseEntity<Result<Boolean>> updateUserInfo(
            @Parameter(description = "用户ID")
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateParams) {
        try {
            boolean result = userService.updateUserInfo(id, updateParams);
            return ResponseEntity.ok(Result.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "清理用户数据", description = "清理用户个人数据（保留账户，清空个人信息）")
    @PostMapping("/{id}/clear-data")
    public ResponseEntity<Result<Boolean>> clearUserData(
            @Parameter(description = "用户ID")
            @PathVariable Long id) {
        try {
            boolean result = userService.clearUserData(id);
            return ResponseEntity.ok(Result.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "导出用户数据", description = "导出用户个人数据为JSON格式")
    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportUserData(
            @Parameter(description = "用户ID")
            @PathVariable Long id) {
        try {
            Map<String, Object> userData = userService.exportUserData(id);
            String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(userData);
            byte[] data = jsonString.getBytes(StandardCharsets.UTF_8);

            String filename = "user-data-" + System.currentTimeMillis() + ".json";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_JSON)
                    .contentLength(data.length)
                    .body(data);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("导出用户数据失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "获取用户数据预览", description = "获取用户导出数据的预览信息（不下载）")
    @GetMapping("/{id}/export-preview")
    public ResponseEntity<Result<Map<String, Object>>> getExportPreview(
            @Parameter(description = "用户ID")
            @PathVariable Long id) {
        try {
            Map<String, Object> userData = userService.exportUserData(id);
            return ResponseEntity.ok(Result.success(userData));
        } catch (RuntimeException e) {
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
