package com.knowledgesystem;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.knowledgesystem.mapper")
public class KnowledgeSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(KnowledgeSystemApplication.class, args);
    }
}
