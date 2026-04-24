package com.knowledgesystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "示例接口", description = "示例接口描述")
@RestController
@RequestMapping("/api/demo")
public class DemoController {

    @Operation(summary = "Hello World", description = "返回Hello World")
    @GetMapping("/hello")
    public String hello() {
        return "Hello World!";
    }
}
