-- 文件信息表
CREATE TABLE IF NOT EXISTS file_info (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    file_extension VARCHAR(20),
    md5 VARCHAR(32),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

-- 添加注释
COMMENT ON TABLE file_info IS '文件信息表';
COMMENT ON COLUMN file_info.id IS '主键ID';
COMMENT ON COLUMN file_info.file_name IS '存储文件名（带时间戳）';
COMMENT ON COLUMN file_info.original_name IS '原始文件名';
COMMENT ON COLUMN file_info.file_path IS '文件存储路径';
COMMENT ON COLUMN file_info.file_size IS '文件大小（字节）';
COMMENT ON COLUMN file_info.content_type IS '文件类型';
COMMENT ON COLUMN file_info.file_extension IS '文件扩展名';
COMMENT ON COLUMN file_info.md5 IS '文件MD5值';
COMMENT ON COLUMN file_info.upload_time IS '上传时间';
COMMENT ON COLUMN file_info.update_time IS '更新时间';
COMMENT ON COLUMN file_info.deleted IS '是否删除（0-未删除，1-已删除）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_info_file_name ON file_info(file_name);
CREATE INDEX IF NOT EXISTS idx_file_info_md5 ON file_info(md5);
CREATE INDEX IF NOT EXISTS idx_file_info_upload_time ON file_info(upload_time);
CREATE INDEX IF NOT EXISTS idx_file_info_deleted ON file_info(deleted);
