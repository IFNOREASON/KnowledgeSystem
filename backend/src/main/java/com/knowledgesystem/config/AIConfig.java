package com.knowledgesystem.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AIConfig {

    private String apiKey;

    private String model = "qwen-math-turbo";

    private String baseUrl = "https://dashscope.aliyuncs.com";

    private Integer maxTokens = 2000;

    private Double temperature = 0.7;

    private Integer maxContextMessages = 20;

    private String systemPrompt = "你是一个专业的知识图谱AI助手，擅长分析知识图谱中的节点和关系。请根据用户的问题，结合知识图谱的上下文，给出专业、准确、有帮助的回答。";
}
