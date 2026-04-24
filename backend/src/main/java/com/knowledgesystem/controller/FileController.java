package com.knowledgesystem.controller;

import com.knowledgesystem.entity.FileInfo;
import com.knowledgesystem.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "文件管理", description = "文件上传、删除、查询接口")
@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @Operation(summary = "上传文件", description = "上传单个文件")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Result<FileInfo>> uploadFile(
            @Parameter(description = "要上传的文件", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile file) {
        try {
            FileInfo fileInfo = fileService.uploadFile(file);
            return ResponseEntity.ok(Result.success(fileInfo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取文件详情", description = "根据ID获取文件详细信息")
    @GetMapping("/{id}")
    public ResponseEntity<Result<FileInfo>> getFileInfo(
            @Parameter(description = "文件ID")
            @PathVariable Long id) {
        try {
            FileInfo fileInfo = fileService.getFileInfo(id);
            return ResponseEntity.ok(Result.success(fileInfo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "删除文件", description = "根据ID删除文件")
    @DeleteMapping("/{id}")
    public ResponseEntity<Result<Void>> deleteFile(
            @Parameter(description = "文件ID")
            @PathVariable Long id) {
        try {
            boolean deleted = fileService.deleteFile(id);
            if (deleted) {
                return ResponseEntity.ok(Result.success(null));
            } else {
                return ResponseEntity.badRequest().body(Result.error("删除失败"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取文件列表", description = "获取所有未删除的文件列表")
    @GetMapping
    public ResponseEntity<Result<List<FileInfo>>> listFiles() {
        List<FileInfo> files = fileService.listAllFiles();
        return ResponseEntity.ok(Result.success(files));
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
