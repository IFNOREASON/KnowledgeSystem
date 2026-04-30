package com.knowledgesystem.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.knowledgesystem.entity.ChatMessage;
import com.knowledgesystem.entity.ChatSession;

import java.util.List;

public interface ChatService extends IService<ChatMessage> {

    ChatSession createSession(Long userId, String title);

    ChatSession getSession(Long sessionId);

    List<ChatSession> getUserSessions(Long userId);

    boolean deleteSession(Long sessionId, Long userId);

    List<ChatMessage> getSessionMessages(Long sessionId);

    ChatMessage sendMessage(Long sessionId, Long userId, String content);

    ChatMessage sendMessageWithNewSession(Long userId, String content);

    boolean clearSessionMessages(Long sessionId, Long userId);
}
