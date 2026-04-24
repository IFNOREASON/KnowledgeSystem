import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onSendMessage?: (message: string) => void;
  welcomeMessage?: string;
}

const AIChat: React.FC<AIChatProps> = ({ 
  onSendMessage,
  welcomeMessage = "您好！我是您的 AI 助手，很高兴为您服务。我可以帮助您分析知识图谱、回答问题、提供建议等。请问有什么可以帮助您的吗？"
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        "根据您的问题，我分析了知识图谱中的相关节点和关系。您提到的概念与多个其他概念有关联，我建议您可以进一步查看这些关联节点的详细信息。",
        "这是一个很好的问题！从知识图谱的角度来看，这个概念处于中心位置，连接了多个重要的子概念。您可以点击图中的节点来查看更多详细信息。",
        "我理解您的需求。基于当前的知识图谱结构，我建议您可以从以下几个方面进行探索：1) 查看核心概念的扩展数据；2) 分析节点之间的关系强度；3) 尝试使用不同的视图模式。",
        "感谢您的提问！我注意到您对这个领域很感兴趣。在知识图谱中，这个概念有丰富的扩展数据，包括类型、描述和标签等信息。您可以通过点击节点来查看完整的扩展数据。",
        "您的问题非常有深度！让我为您分析一下：从知识图谱的结构来看，这个概念与其他多个概念形成了一个紧密的关联网络。建议您可以使用缩放和拖拽功能来更好地查看整个图谱结构。"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    if (onSendMessage) {
      onSendMessage(userMessage.content);
    }

    simulateAIResponse(userMessage.content);
  };

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

  return (
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
            onClick={() => {
              setMessages([{
                id: generateId(),
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date()
              }]);
            }}
            title="清空对话"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => renderMessage(message))}
        
        {isTyping && (
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
            disabled={isTyping}
            className="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
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
  );
};

export default AIChat;
