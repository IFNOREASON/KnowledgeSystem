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
            initFileInfoTable();
            initChatSessionTable();
            initChatMessageTable();
            log.info("数据库表初始化完成");
        } catch (Exception e) {
            log.error("数据库表初始化失败", e);
        }
    }

    private void initFileInfoTable() {
        boolean tableExists = checkTableExists("file_info");
        
        if (!tableExists) {
            log.info("创建 file_info 表...");
            String sql = 
                "CREATE TABLE IF NOT EXISTS file_info (" +
                "    id BIGSERIAL PRIMARY KEY," +
                "    file_name VARCHAR(255) NOT NULL," +
                "    original_name VARCHAR(255) NOT NULL," +
                "    file_path VARCHAR(500)," +
                "    file_size BIGINT NOT NULL," +
                "    content_type VARCHAR(100)," +
                "    file_extension VARCHAR(20)," +
                "    md5 VARCHAR(32)," +
                "    storage_type VARCHAR(20) DEFAULT 'local'," +
                "    bucket_name VARCHAR(255)," +
                "    object_name VARCHAR(255)," +
                "    access_url VARCHAR(1000)," +
                "    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "    deleted SMALLINT DEFAULT 0" +
                ")";
            jdbcTemplate.execute(sql);
            log.info("file_info 表创建成功");
        } else {
            log.info("file_info 表已存在，检查是否需要更新字段...");
            updateFileInfoTableColumns();
        }

        createFileInfoIndexes();
    }

    private boolean checkTableExists(String tableName) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?",
                Integer.class,
                tableName
            );
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("检查表 {} 是否存在时出错: {}", tableName, e.getMessage());
            return false;
        }
    }

    private void updateFileInfoTableColumns() {
        try {
            addColumnIfNotExists("file_info", "storage_type", "VARCHAR(20) DEFAULT 'local'");
            addColumnIfNotExists("file_info", "bucket_name", "VARCHAR(255)");
            addColumnIfNotExists("file_info", "object_name", "VARCHAR(255)");
            addColumnIfNotExists("file_info", "access_url", "VARCHAR(1000)");
            
            makeColumnNullable("file_info", "file_path", "VARCHAR(500)");
            
            log.info("file_info 表字段更新完成");
        } catch (Exception e) {
            log.error("更新 file_info 表字段失败", e);
        }
    }
    
    private void makeColumnNullable(String tableName, String columnName, String columnDefinition) {
        try {
            String sql = "ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " DROP NOT NULL";
            jdbcTemplate.execute(sql);
            log.info("字段 {}.{} 已修改为允许为空", tableName, columnName);
        } catch (Exception e) {
            log.warn("修改字段 {}.{} 允许为空时出错（可能已允许为空）: {}", tableName, columnName, e.getMessage());
        }
    }

    private void createFileInfoIndexes() {
        try {
            createIndexIfNotExists("idx_file_info_file_name", "file_info", "file_name");
            createIndexIfNotExists("idx_file_info_md5", "file_info", "md5");
            createIndexIfNotExists("idx_file_info_upload_time", "file_info", "upload_time");
            createIndexIfNotExists("idx_file_info_deleted", "file_info", "deleted");
            
            if (checkColumnExists("file_info", "storage_type")) {
                createIndexIfNotExists("idx_file_info_storage_type", "file_info", "storage_type");
            }
            if (checkColumnExists("file_info", "bucket_name")) {
                createIndexIfNotExists("idx_file_info_bucket_name", "file_info", "bucket_name");
            }
            if (checkColumnExists("file_info", "object_name")) {
                createIndexIfNotExists("idx_file_info_object_name", "file_info", "object_name");
            }
            
            log.info("file_info 表索引创建完成");
        } catch (Exception e) {
            log.error("创建 file_info 表索引失败", e);
        }
    }

    private boolean checkColumnExists(String tableName, String columnName) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
                Integer.class,
                tableName,
                columnName
            );
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("检查字段 {}.{} 是否存在时出错: {}", tableName, columnName, e.getMessage());
            return false;
        }
    }

    private void addColumnIfNotExists(String tableName, String columnName, String columnDefinition) {
        if (checkColumnExists(tableName, columnName)) {
            log.info("字段 {}.{} 已存在", tableName, columnName);
            return;
        }
        
        try {
            log.info("添加字段 {}.{}", tableName, columnName);
            String sql = "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition;
            jdbcTemplate.execute(sql);
            log.info("字段 {}.{} 添加成功", tableName, columnName);
        } catch (Exception e) {
            log.warn("添加字段 {}.{} 失败: {}", tableName, columnName, e.getMessage());
        }
    }

    private void createIndexIfNotExists(String indexName, String tableName, String columnName) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE indexname = ? AND tablename = ?",
                Integer.class,
                indexName,
                tableName
            );
            
            if (count != null && count > 0) {
                log.info("索引 {} 已存在", indexName);
                return;
            }
        } catch (Exception e) {
            log.info("检查索引 {} 是否存在时出错，尝试直接创建", indexName);
        }
        
        try {
            log.info("创建索引 {} ON {}(...)", indexName, tableName);
            String sql = "CREATE INDEX " + indexName + " ON " + tableName + "(" + columnName + ")";
            jdbcTemplate.execute(sql);
            log.info("索引 {} 创建成功", indexName);
        } catch (Exception ex) {
            log.info("索引 {} 可能已存在或创建失败: {}", indexName, ex.getMessage());
        }
    }

    private void initChatSessionTable() {
        if (checkTableExists("chat_session")) {
            log.info("chat_session 表已存在");
            return;
        }
        
        try {
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
            
            createIndexIfNotExists("idx_chat_session_user_id", "chat_session", "user_id");
            createIndexIfNotExists("idx_chat_session_deleted", "chat_session", "deleted");
            
            log.info("chat_session 表创建成功");
        } catch (Exception e) {
            log.error("创建 chat_session 表失败", e);
        }
    }

    private void initChatMessageTable() {
        if (checkTableExists("chat_message")) {
            log.info("chat_message 表已存在");
            return;
        }
        
        try {
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
            
            createIndexIfNotExists("idx_chat_message_session_id", "chat_message", "session_id");
            createIndexIfNotExists("idx_chat_message_create_time", "chat_message", "create_time");
            createIndexIfNotExists("idx_chat_message_deleted", "chat_message", "deleted");
            
            log.info("chat_message 表创建成功");
        } catch (Exception e) {
            log.error("创建 chat_message 表失败", e);
        }
    }
}
