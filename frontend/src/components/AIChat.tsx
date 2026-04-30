import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi, ChatMessage as ApiChatMessage } from '../api/chatApi';
import './AIChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const DEFAULT_WELCOME_MESSAGE = "您好！我是您的 AI 助手，很高兴为您服务。我可以帮助您分析知识图谱、回答问题、提供建议等。请问有什么可以帮助您的吗？";

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const convertApiMessage = (apiMsg: ApiChatMessage): Message => ({
    id: apiMsg.id.toString(),
    role: apiMsg.role as 'user' | 'assistant' | 'system',
    content: apiMsg.content,
    timestamp: new Date(apiMsg.createTime)
  });

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const initSession = useCallback(async () => {
    if (initialized) return;
    try {
      setIsLoading(true);
      const sessionsResponse = await chatApi.getUserSessions();
      if (sessionsResponse.code === 200 && sessionsResponse.data.length > 0) {
        const latestSession = sessionsResponse.data[0];
        setSessionId(latestSession.id);
        const messagesResponse = await chatApi.getSessionMessages(latestSession.id);
        if (messagesResponse.code === 200 && messagesResponse.data.length > 0) {
          const convertedMessages = messagesResponse.data.map(convertApiMessage);
          setMessages(convertedMessages);
        } else {
          setMessages([{
            id: generateId(),
            role: 'assistant',
            content: DEFAULT_WELCOME_MESSAGE,
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          id: generateId(),
          role: 'assistant',
          content: DEFAULT_WELCOME_MESSAGE,
          timestamp: new Date()
        }]);
      }
      setInitialized(true);
    } catch (error) {
      console.error('初始化会话失败:', error);
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: DEFAULT_WELCOME_MESSAGE,
        timestamp: new Date()
      }]);
      setInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [initialized]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      let response;
      if (sessionId) {
        response = await chatApi.sendMessage(sessionId, currentContent);
      } else {
        response = await chatApi.sendMessageNewSession(currentContent);
        if (response.code === 200) {
          setSessionId(response.data.sessionId);
        }
      }

      if (response.code === 200) {
        const aiMessage = convertApiMessage(response.data);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '抱歉，发送消息失败，请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessionId]);

  const handleClear = useCallback(async () => {
    try {
      if (sessionId) {
        await chatApi.clearSessionMessages(sessionId);
      }
      setSessionId(null);
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: DEFAULT_WELCOME_MESSAGE,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('清空对话失败:', error);
    }
  }, [sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={message.id} 
        className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}
      >
        <div className="message-avatar">
          {isUser ? (
            <div className="avatar user-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                <path d="M12 14C9.23858 14 7 16.2386 7 19V22H17V19C17 16.2386 14.7614 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>
          ) : (
            <div className="avatar ai-avatar">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender">
              {isUser ? '您' : 'AI 助手'}
            </span>
            <span className="message-time">
              {formatTime(message.timestamp)}
            </span>
          </div>
          <div className="message-bubble">
            <p>{message.content}</p>
          </div>
        </div>
      </div>
    );
  };

  const toggleChat = () => {
    if (!isOpen && !initialized) {
      initSession();
    }
    setIsOpen(prev => !prev);
  };

  if (!isOpen) {
    return (
      <div className="ai-chat-floating-button" onClick={toggleChat}>
        <div className="floating-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="floating-tooltip">AI 助手</div>
      </div>
    );
  }

  return (
    <div className="ai-chat-floating">
      <div className="ai-chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <div className="ai-indicator">
              <div className="ai-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ai-status">
                <h3>智能助手</h3>
                <span className="status-dot online"></span>
                <span className="status-text">在线</span>
              </div>
            </div>
          </div>
          <div className="chat-actions">
            <button 
              className="action-btn"
              onClick={handleClear}
              title="清空对话"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="action-btn"
              onClick={toggleChat}
              title="最小化"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map(message => renderMessage(message))}
          
          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="message-avatar">
                <div className="avatar ai-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">AI 助手</span>
                </div>
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题... (Enter 发送，Shift+Enter 换行)"
              rows={1}
              disabled={isLoading}
              className="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="send-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="input-hint">
            <span>提示：您可以询问关于知识图谱的问题，或者请求 AI 帮您分析图中的节点和关系</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
