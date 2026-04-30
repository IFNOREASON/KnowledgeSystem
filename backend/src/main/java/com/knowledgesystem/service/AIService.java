package com.knowledgesystem.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgesystem.config.AIConfig;
import com.knowledgesystem.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class AIService {

    private final AIConfig aiConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String GENERATION_PATH = "/api/v1/services/aigc/text-generation/generation";

    public AIService(AIConfig aiConfig, ObjectMapper objectMapper) {
        this.aiConfig = aiConfig;
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public String generateResponse(List<ChatMessage> contextMessages, String userMessage) {
        if (!StringUtils.hasText(aiConfig.getApiKey())) {
            log.warn("AI API Key 未配置，使用模拟响应（支持简单上下文记忆）");
            log.info("上下文消息数: {}", contextMessages != null ? contextMessages.size() : 0);
            if (contextMessages != null && !contextMessages.isEmpty()) {
                log.info("历史消息预览:");
                for (int i = 0; i < contextMessages.size(); i++) {
                    ChatMessage msg = contextMessages.get(i);
                    log.info("  [{}] {}: {}", i + 1, msg.getRole(), 
                        msg.getContent().length() > 50 ? msg.getContent().substring(0, 50) + "..." : msg.getContent());
                }
            }
            return getMockResponseWithContext(contextMessages, userMessage);
        }

        try {
            List<Map<String, String>> messages = buildMessages(contextMessages, userMessage);
            
            log.info("========== 调用 AI API 开始 ==========");
            log.info("模型: {}", aiConfig.getModel());
            log.info("消息总数: {}", messages.size());
            log.info("消息列表:");
            for (int i = 0; i < messages.size(); i++) {
                Map<String, String> msg = messages.get(i);
                String content = msg.get("content");
                if (content != null && content.length() > 100) {
                    content = content.substring(0, 100) + "...";
                }
                log.info("  [{}] {}: {}", i + 1, msg.get("role"), content);
            }
            
            Map<String, Object> requestBody = buildRequestBody(messages);
            
            String url = aiConfig.getBaseUrl() + GENERATION_PATH;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + aiConfig.getApiKey());
            
            log.debug("请求 URL: {}", url);
            log.debug("请求体: {}", objectMapper.writeValueAsString(requestBody));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            log.info("API 响应状态码: {}", response.getStatusCode());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                log.debug("API 响应体: {}", responseBody);
                
                String result = parseResponse(responseBody);
                
                log.info("AI 回复: {}", result.length() > 200 ? result.substring(0, 200) + "..." : result);
                log.info("========== 调用 AI API 结束 ==========");
                
                return result;
            } else {
                log.error("AI API 调用失败，状态码: {}", response.getStatusCode());
                throw new RuntimeException("AI API 调用失败: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("调用 AI API 失败", e);
            throw new RuntimeException("AI 服务暂时不可用: " + e.getMessage(), e);
        }
    }

    private List<Map<String, String>> buildMessages(List<ChatMessage> contextMessages, String userMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        
        if (StringUtils.hasText(aiConfig.getSystemPrompt())) {
            Map<String, String> systemMessage = new LinkedHashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", aiConfig.getSystemPrompt());
            messages.add(systemMessage);
        }
        
        if (contextMessages != null && !contextMessages.isEmpty()) {
            int maxContext = aiConfig.getMaxContextMessages() != null ? aiConfig.getMaxContextMessages() : 20;
            
            int totalMessages = contextMessages.size();
            int startIndex = Math.max(0, totalMessages - maxContext);
            
            if (startIndex > 0) {
                log.warn("上下文消息数({})超过限制({})，将只保留最近 {} 条消息", 
                    totalMessages, maxContext, maxContext);
            }
            
            for (int i = startIndex; i < contextMessages.size(); i++) {
                ChatMessage msg = contextMessages.get(i);
                Map<String, String> message = new LinkedHashMap<>();
                message.put("role", msg.getRole());
                message.put("content", msg.getContent());
                messages.add(message);
            }
        }
        
        Map<String, String> userMsg = new LinkedHashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        
        return messages;
    }

    private Map<String, Object> buildRequestBody(List<Map<String, String>> messages) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", aiConfig.getModel());
        
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("messages", messages);
        requestBody.put("input", input);
        
        Map<String, Object> parameters = new LinkedHashMap<>();
        if (aiConfig.getMaxTokens() != null) {
            parameters.put("max_tokens", aiConfig.getMaxTokens());
        }
        if (aiConfig.getTemperature() != null) {
            parameters.put("temperature", aiConfig.getTemperature());
        }
        parameters.put("result_format", "message");
        requestBody.put("parameters", parameters);
        
        return requestBody;
    }

    private String parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            
            JsonNode output = root.path("output");
            if (output.isMissingNode()) {
                throw new RuntimeException("响应格式错误: 缺少 output 字段");
            }
            
            JsonNode choices = output.path("choices");
            if (choices.isMissingNode() || !choices.isArray() || choices.size() == 0) {
                throw new RuntimeException("响应格式错误: 缺少 choices 字段");
            }
            
            JsonNode firstChoice = choices.get(0);
            JsonNode message = firstChoice.path("message");
            if (message.isMissingNode()) {
                throw new RuntimeException("响应格式错误: 缺少 message 字段");
            }
            
            String content = message.path("content").asText();
            if (!StringUtils.hasText(content)) {
                throw new RuntimeException("响应内容为空");
            }
            
            return content;
            
        } catch (Exception e) {
            log.error("解析 AI 响应失败", e);
            throw new RuntimeException("解析 AI 响应失败: " + e.getMessage(), e);
        }
    }

    private String getMockResponseWithContext(List<ChatMessage> contextMessages, String userMessage) {
        StringBuilder sb = new StringBuilder();
        
        boolean hasHistory = contextMessages != null && !contextMessages.isEmpty();
        
        if (hasHistory) {
            sb.append("（基于之前的对话上下文）\n\n");
            
            List<String> userQuestions = new ArrayList<>();
            for (ChatMessage msg : contextMessages) {
                if ("user".equals(msg.getRole())) {
                    userQuestions.add(msg.getContent());
                }
            }
            
            if (userQuestions.size() >= 1) {
                String lastQuestion = userQuestions.get(userQuestions.size() - 1);
                sb.append("我记得您之前问过关于「").append(lastQuestion).append("」的问题。\n\n");
            }
        }
        
        List<String> baseResponses = Arrays.asList(
            "关于您的问题「" + userMessage + "」，我来为您详细解答：\n\n" +
            "从知识图谱的角度分析，这个概念与多个其他节点存在关联关系。建议您可以：\n" +
            "1. 查看该节点的详细属性信息\n" +
            "2. 探索与其相连的其他节点\n" +
            "3. 使用缩放和拖拽功能来查看完整的关联网络",
            
            "我理解您想了解「" + userMessage + "」。\n\n" +
            "在知识图谱中，这个概念具有丰富的扩展数据。您可以：\n" +
            "- 点击节点查看类型、描述和标签等详细信息\n" +
            "- 分析该节点与其他节点之间的关系强度\n" +
            "- 尝试使用不同的视图模式来获得新的洞察",
            
            "这是一个很好的问题！关于「" + userMessage + "」：\n\n" +
            "从知识图谱的结构来看，这个概念处于一个重要的位置。我建议您：\n" +
            "1. 先了解这个概念的基本定义和属性\n" +
            "2. 然后探索它与其他概念的关联\n" +
            "3. 最后可以尝试一些高级的图分析功能",
            
            "感谢您的提问！关于「" + userMessage + "」：\n\n" +
            "这个概念在知识图谱中有很多有趣的连接。让我帮您梳理一下：\n" +
            "- 核心属性：该节点包含类型、描述等基本信息\n" +
            "- 关联关系：与多个其他概念形成关联网络\n" +
            "- 扩展数据：可能包含标签、权重等附加信息\n\n" +
            "您可以通过点击图中的节点来查看完整的扩展数据。"
        );
        
        Random random = new Random();
        sb.append(baseResponses.get(random.nextInt(baseResponses.size())));
        
        if (hasHistory) {
            sb.append("\n\n（提示：我记住了我们之前的对话内容，可以继续深入讨论。）");
        }
        
        return sb.toString();
    }

    public int estimateTokenCount(String text) {
        if (text == null) {
            return 0;
        }
        int chineseChars = 0;
        int otherChars = 0;
        for (char c : text.toCharArray()) {
            if (Character.toString(c).matches("[\\u4e00-\\u9fa5]")) {
                chineseChars++;
            } else {
                otherChars++;
            }
        }
        return chineseChars + (otherChars / 4);
    }
}
