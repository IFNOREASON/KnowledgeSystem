package com.knowledgesystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Knowledge System API")
                        .description("知识管理系统后端接口文档")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Knowledge System Team")));
    }
}
