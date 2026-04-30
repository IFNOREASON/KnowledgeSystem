package com.knowledgesystem.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.knowledgesystem.entity.ChatMessage;
import com.knowledgesystem.entity.ChatSession;
import com.knowledgesystem.mapper.ChatMessageMapper;
import com.knowledgesystem.mapper.ChatSessionMapper;
import com.knowledgesystem.service.AIService;
import com.knowledgesystem.service.ChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ChatServiceImpl extends ServiceImpl<ChatMessageMapper, ChatMessage> implements ChatService {

    private final ChatSessionMapper chatSessionMapper;
    private final AIService aiService;

    private static final int MAX_CONTEXT_MESSAGES = 20;

    public ChatServiceImpl(ChatSessionMapper chatSessionMapper, AIService aiService) {
        this.chatSessionMapper = chatSessionMapper;
        this.aiService = aiService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatSession createSession(Long userId, String title) {
        if (userId == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        ChatSession session = new ChatSession();
        session.setUserId(userId);
        session.setTitle(StringUtils.hasText(title) ? title : "新对话");
        session.setCreateTime(LocalDateTime.now());
        session.setUpdateTime(LocalDateTime.now());
        session.setDeleted(0);

        chatSessionMapper.insert(session);
        log.info("创建对话会话成功，用户ID: {}, 会话ID: {}", userId, session.getId());
        return session;
    }

    @Override
    public ChatSession getSession(Long sessionId) {
        if (sessionId == null) {
            throw new RuntimeException("会话ID不能为空");
        }
        ChatSession session = chatSessionMapper.selectById(sessionId);
        if (session == null || session.getDeleted() == 1) {
            throw new RuntimeException("会话不存在或已被删除");
        }
        return session;
    }

    @Override
    public List<ChatSession> getUserSessions(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        return chatSessionMapper.selectList(
            new LambdaQueryWrapper<ChatSession>()
                .eq(ChatSession::getUserId, userId)
                .eq(ChatSession::getDeleted, 0)
                .orderByDesc(ChatSession::getUpdateTime)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteSession(Long sessionId, Long userId) {
        if (sessionId == null || userId == null) {
            throw new RuntimeException("会话ID和用户ID不能为空");
        }

        ChatSession session = getSession(sessionId);
        if (!userId.equals(session.getUserId())) {
            throw new RuntimeException("无权删除该会话");
        }

        session.setDeleted(1);
        session.setUpdateTime(LocalDateTime.now());
        chatSessionMapper.updateById(session);

        baseMapper.delete(
            new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getSessionId, sessionId)
        );

        log.info("删除对话会话成功，会话ID: {}", sessionId);
        return true;
    }

    @Override
    public List<ChatMessage> getSessionMessages(Long sessionId) {
        if (sessionId == null) {
            return new ArrayList<>();
        }
        return baseMapper.selectList(
            new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getSessionId, sessionId)
                .eq(ChatMessage::getDeleted, 0)
                .orderByAsc(ChatMessage::getCreateTime)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatMessage sendMessage(Long sessionId, Long userId, String content) {
        if (sessionId == null) {
            throw new RuntimeException("会话ID不能为空");
        }
        if (!StringUtils.hasText(content)) {
            throw new RuntimeException("消息内容不能为空");
        }

        ChatSession session = getSession(sessionId);
        if (!userId.equals(session.getUserId())) {
            throw new RuntimeException("无权访问该会话");
        }

        List<ChatMessage> contextMessages = getContextMessages(sessionId);

        ChatMessage userMessage = new ChatMessage();
        userMessage.setSessionId(sessionId);
        userMessage.setRole("user");
        userMessage.setContent(content.trim());
        userMessage.setTokenCount(aiService.estimateTokenCount(content));
        userMessage.setCreateTime(LocalDateTime.now());
        userMessage.setUpdateTime(LocalDateTime.now());
        userMessage.setDeleted(0);
        baseMapper.insert(userMessage);

        log.info("调用 AI 服务，会话ID: {}, 上下文消息数: {}", sessionId, contextMessages.size());
        String aiResponse = aiService.generateResponse(contextMessages, content.trim());

        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setSessionId(sessionId);
        aiMessage.setRole("assistant");
        aiMessage.setContent(aiResponse);
        aiMessage.setTokenCount(aiService.estimateTokenCount(aiResponse));
        aiMessage.setCreateTime(LocalDateTime.now());
        aiMessage.setUpdateTime(LocalDateTime.now());
        aiMessage.setDeleted(0);
        baseMapper.insert(aiMessage);

        session.setUpdateTime(LocalDateTime.now());
        if (session.getTitle().equals("新对话") && content.length() > 0) {
            String newTitle = content.length() > 30 ? content.substring(0, 30) + "..." : content;
            session.setTitle(newTitle);
        }
        chatSessionMapper.updateById(session);

        log.info("发送消息成功，会话ID: {}, 用户消息ID: {}, AI消息ID: {}", sessionId, userMessage.getId(), aiMessage.getId());
        return aiMessage;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatMessage sendMessageWithNewSession(Long userId, String content) {
        ChatSession session = createSession(userId, null);
        return sendMessage(session.getId(), userId, content);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean clearSessionMessages(Long sessionId, Long userId) {
        if (sessionId == null || userId == null) {
            throw new RuntimeException("会话ID和用户ID不能为空");
        }

        ChatSession session = getSession(sessionId);
        if (!userId.equals(session.getUserId())) {
            throw new RuntimeException("无权操作该会话");
        }

        baseMapper.delete(
            new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getSessionId, sessionId)
        );

        session.setUpdateTime(LocalDateTime.now());
        session.setTitle("新对话");
        chatSessionMapper.updateById(session);

        log.info("清空会话消息成功，会话ID: {}", sessionId);
        return true;
    }

    private List<ChatMessage> getContextMessages(Long sessionId) {
        List<ChatMessage> allMessages = getSessionMessages(sessionId);
        if (allMessages.size() <= MAX_CONTEXT_MESSAGES) {
            return allMessages;
        }
        return allMessages.subList(allMessages.size() - MAX_CONTEXT_MESSAGES, allMessages.size());
    }
}
