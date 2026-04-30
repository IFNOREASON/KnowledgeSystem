package com.knowledgesystem.controller;

import com.knowledgesystem.entity.ChatMessage;
import com.knowledgesystem.entity.ChatSession;
import com.knowledgesystem.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Tag(name = "AI对话管理", description = "对话会话、消息发送、上下文管理接口")
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    private static final Long DEFAULT_USER_ID = 1L;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @Operation(summary = "创建新对话", description = "创建一个新的对话会话")
    @PostMapping("/sessions")
    public ResponseEntity<Result<ChatSessionDTO>> createSession(
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            String title = request != null ? request.get("title") : null;
            ChatSession session = chatService.createSession(actualUserId, title);
            return ResponseEntity.ok(Result.success(convertToDTO(session)));
        } catch (RuntimeException e) {
            log.error("创建会话失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取用户会话列表", description = "获取用户的所有对话会话")
    @GetMapping("/sessions")
    public ResponseEntity<Result<List<ChatSessionDTO>>> getUserSessions(
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            List<ChatSession> sessions = chatService.getUserSessions(actualUserId);
            List<ChatSessionDTO> sessionDTOs = sessions.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Result.success(sessionDTOs));
        } catch (RuntimeException e) {
            log.error("获取会话列表失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取会话详情", description = "根据会话ID获取会话详情")
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<Result<ChatSessionDTO>> getSession(
            @Parameter(description = "会话ID")
            @PathVariable Long sessionId) {
        try {
            ChatSession session = chatService.getSession(sessionId);
            return ResponseEntity.ok(Result.success(convertToDTO(session)));
        } catch (RuntimeException e) {
            log.error("获取会话详情失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "删除会话", description = "删除指定的对话会话")
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Result<Boolean>> deleteSession(
            @Parameter(description = "会话ID")
            @PathVariable Long sessionId,
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            boolean result = chatService.deleteSession(sessionId, actualUserId);
            return ResponseEntity.ok(Result.success(result));
        } catch (RuntimeException e) {
            log.error("删除会话失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "发送消息", description = "向指定会话发送消息并获取AI回复")
    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<Result<ChatMessageDTO>> sendMessage(
            @Parameter(description = "会话ID")
            @PathVariable Long sessionId,
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId,
            @RequestBody Map<String, String> request) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            String content = request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Result.error("消息内容不能为空"));
            }
            ChatMessage aiMessage = chatService.sendMessage(sessionId, actualUserId, content.trim());
            return ResponseEntity.ok(Result.success(convertToDTO(aiMessage)));
        } catch (RuntimeException e) {
            log.error("发送消息失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "发送新对话消息", description = "创建新会话并发送消息")
    @PostMapping("/messages")
    public ResponseEntity<Result<ChatMessageDTO>> sendMessageNewSession(
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId,
            @RequestBody Map<String, String> request) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            String content = request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Result.error("消息内容不能为空"));
            }
            ChatMessage aiMessage = chatService.sendMessageWithNewSession(actualUserId, content.trim());
            return ResponseEntity.ok(Result.success(convertToDTO(aiMessage)));
        } catch (RuntimeException e) {
            log.error("发送消息失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "获取会话消息列表", description = "获取指定会话的所有消息")
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<Result<List<ChatMessageDTO>>> getSessionMessages(
            @Parameter(description = "会话ID")
            @PathVariable Long sessionId) {
        try {
            List<ChatMessage> messages = chatService.getSessionMessages(sessionId);
            List<ChatMessageDTO> messageDTOs = messages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Result.success(messageDTOs));
        } catch (RuntimeException e) {
            log.error("获取消息列表失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    @Operation(summary = "清空会话消息", description = "清空指定会话的所有消息")
    @PostMapping("/sessions/{sessionId}/clear")
    public ResponseEntity<Result<Boolean>> clearSessionMessages(
            @Parameter(description = "会话ID")
            @PathVariable Long sessionId,
            @Parameter(description = "用户ID")
            @RequestParam(required = false) Long userId) {
        try {
            Long actualUserId = userId != null ? userId : DEFAULT_USER_ID;
            boolean result = chatService.clearSessionMessages(sessionId, actualUserId);
            return ResponseEntity.ok(Result.success(result));
        } catch (RuntimeException e) {
            log.error("清空会话消息失败", e);
            return ResponseEntity.badRequest().body(Result.error(e.getMessage()));
        }
    }

    private ChatSessionDTO convertToDTO(ChatSession session) {
        ChatSessionDTO dto = new ChatSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setTitle(session.getTitle());
        dto.setCreateTime(session.getCreateTime());
        dto.setUpdateTime(session.getUpdateTime());
        return dto;
    }

    private ChatMessageDTO convertToDTO(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setId(message.getId());
        dto.setSessionId(message.getSessionId());
        dto.setRole(message.getRole());
        dto.setContent(message.getContent());
        dto.setTokenCount(message.getTokenCount());
        dto.setCreateTime(message.getCreateTime());
        return dto;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatSessionDTO {
        private Long id;
        private Long userId;
        private String title;
        private LocalDateTime createTime;
        private LocalDateTime updateTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDTO {
        private Long id;
        private Long sessionId;
        private String role;
        private String content;
        private Integer tokenCount;
        private LocalDateTime createTime;
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
