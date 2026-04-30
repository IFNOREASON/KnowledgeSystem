package com.knowledgesystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
public class DatabaseInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            initChatSessionTable();
            initChatMessageTable();
            log.info("数据库表初始化完成");
        } catch (Exception e) {
            log.error("数据库表初始化失败", e);
        }
    }

    private void initChatSessionTable() {
        try {
            jdbcTemplate.queryForObject(
                "SELECT 1 FROM chat_session LIMIT 1",
                Integer.class
            );
            log.info("chat_session 表已存在");
        } catch (Exception e) {
            log.info("创建 chat_session 表...");
            String sql = 
                "CREATE TABLE IF NOT EXISTS chat_session (" +
                "    id BIGSERIAL PRIMARY KEY," +
                "    user_id BIGINT NOT NULL," +
                "    title VARCHAR(200) DEFAULT '新对话'," +
                "    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    deleted SMALLINT DEFAULT 0" +
                ")";
            jdbcTemplate.execute(sql);
            
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_chat_session_user_id ON chat_session(user_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_chat_session_deleted ON chat_session(deleted)");
            
            log.info("chat_session 表创建成功");
        }
    }

    private void initChatMessageTable() {
        try {
            jdbcTemplate.queryForObject(
                "SELECT 1 FROM chat_message LIMIT 1",
                Integer.class
            );
            log.info("chat_message 表已存在");
        } catch (Exception e) {
            log.info("创建 chat_message 表...");
            String sql = 
                "CREATE TABLE IF NOT EXISTS chat_message (" +
                "    id BIGSERIAL PRIMARY KEY," +
                "    session_id BIGINT NOT NULL," +
                "    role VARCHAR(20) NOT NULL," +
                "    content TEXT NOT NULL," +
                "    token_count INTEGER DEFAULT 0," +
                "    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    deleted SMALLINT DEFAULT 0" +
                ")";
            jdbcTemplate.execute(sql);
            
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_chat_message_create_time ON chat_message(create_time)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_chat_message_deleted ON chat_message(deleted)");
            
            log.info("chat_message 表创建成功");
        }
    }
}
