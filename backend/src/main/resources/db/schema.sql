-- 文件信息表
CREATE TABLE IF NOT EXISTS file_info (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    file_extension VARCHAR(20),
    md5 VARCHAR(32),
    storage_type VARCHAR(20) DEFAULT 'local',
    bucket_name VARCHAR(255),
    object_name VARCHAR(255),
    access_url VARCHAR(1000),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

-- 添加注释
COMMENT ON TABLE file_info IS '文件信息表';
COMMENT ON COLUMN file_info.id IS '主键ID';
COMMENT ON COLUMN file_info.file_name IS '存储文件名（带时间戳）';
COMMENT ON COLUMN file_info.original_name IS '原始文件名';
COMMENT ON COLUMN file_info.file_path IS '文件存储路径（本地存储时使用）';
COMMENT ON COLUMN file_info.file_size IS '文件大小（字节）';
COMMENT ON COLUMN file_info.content_type IS '文件类型';
COMMENT ON COLUMN file_info.file_extension IS '文件扩展名';
COMMENT ON COLUMN file_info.md5 IS '文件MD5值';
COMMENT ON COLUMN file_info.storage_type IS '存储类型（local-本地存储，minio-MinIO对象存储）';
COMMENT ON COLUMN file_info.bucket_name IS 'MinIO存储桶名称';
COMMENT ON COLUMN file_info.object_name IS 'MinIO对象名称';
COMMENT ON COLUMN file_info.access_url IS '文件访问URL';
COMMENT ON COLUMN file_info.upload_time IS '上传时间';
COMMENT ON COLUMN file_info.update_time IS '更新时间';
COMMENT ON COLUMN file_info.deleted IS '是否删除（0-未删除，1-已删除）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_info_file_name ON file_info(file_name);
CREATE INDEX IF NOT EXISTS idx_file_info_md5 ON file_info(md5);
CREATE INDEX IF NOT EXISTS idx_file_info_upload_time ON file_info(upload_time);
CREATE INDEX IF NOT EXISTS idx_file_info_deleted ON file_info(deleted);
CREATE INDEX IF NOT EXISTS idx_file_info_storage_type ON file_info(storage_type);
CREATE INDEX IF NOT EXISTS idx_file_info_bucket_name ON file_info(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_info_object_name ON file_info(object_name);

-- 用户信息表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    nickname VARCHAR(50),
    avatar VARCHAR(500),
    gender SMALLINT DEFAULT 0,
    birthday DATE,
    bio VARCHAR(500),
    status SMALLINT DEFAULT 1,
    last_login_time TIMESTAMP,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

-- 添加用户表注释
COMMENT ON TABLE sys_user IS '用户信息表';
COMMENT ON COLUMN sys_user.id IS '主键ID';
COMMENT ON COLUMN sys_user.username IS '用户名';
COMMENT ON COLUMN sys_user.password IS '密码';
COMMENT ON COLUMN sys_user.email IS '邮箱';
COMMENT ON COLUMN sys_user.phone IS '手机号';
COMMENT ON COLUMN sys_user.nickname IS '昵称';
COMMENT ON COLUMN sys_user.avatar IS '头像URL';
COMMENT ON COLUMN sys_user.gender IS '性别（0-未知，1-男，2-女）';
COMMENT ON COLUMN sys_user.birthday IS '生日';
COMMENT ON COLUMN sys_user.bio IS '个人简介';
COMMENT ON COLUMN sys_user.status IS '状态（0-禁用，1-正常）';
COMMENT ON COLUMN sys_user.last_login_time IS '最后登录时间';
COMMENT ON COLUMN sys_user.create_time IS '创建时间';
COMMENT ON COLUMN sys_user.update_time IS '更新时间';
COMMENT ON COLUMN sys_user.deleted IS '是否删除（0-未删除，1-已删除）';

-- 创建用户表索引
CREATE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_sys_user_email ON sys_user(email);
CREATE INDEX IF NOT EXISTS idx_sys_user_phone ON sys_user(phone);
CREATE INDEX IF NOT EXISTS idx_sys_user_deleted ON sys_user(deleted);

-- 初始化默认用户
INSERT INTO sys_user (username, password, email, phone, nickname, avatar, gender, bio, status)
VALUES ('admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin@example.com', '13800138000', '管理员', 
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20user%20avatar%20icon%20minimalist%20design&image_size=square',
        0, '系统管理员', 1)
ON CONFLICT (username) DO NOTHING;

-- 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description VARCHAR(500),
    is_public SMALLINT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

-- 添加配置表注释
COMMENT ON TABLE sys_config IS '系统配置表';
COMMENT ON COLUMN sys_config.id IS '主键ID';
COMMENT ON COLUMN sys_config.config_key IS '配置键';
COMMENT ON COLUMN sys_config.config_value IS '配置值';
COMMENT ON COLUMN sys_config.description IS '配置描述';
COMMENT ON COLUMN sys_config.is_public IS '是否公开（0-私有，1-公开）';
COMMENT ON COLUMN sys_config.create_time IS '创建时间';
COMMENT ON COLUMN sys_config.update_time IS '更新时间';
COMMENT ON COLUMN sys_config.deleted IS '是否删除（0-未删除，1-已删除）';

-- 创建配置表索引
CREATE INDEX IF NOT EXISTS idx_sys_config_key ON sys_config(config_key);
CREATE INDEX IF NOT EXISTS idx_sys_config_public ON sys_config(is_public);
CREATE INDEX IF NOT EXISTS idx_sys_config_deleted ON sys_config(deleted);

-- 初始化默认主题配置
INSERT INTO sys_config (config_key, config_value, description, is_public)
VALUES ('app.theme', 'light', '应用主题设置 (light/dark)', 1)
ON CONFLICT (config_key) DO NOTHING;

-- 对话会话表
CREATE TABLE IF NOT EXISTS chat_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) DEFAULT '新对话',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

COMMENT ON TABLE chat_session IS '对话会话表';
COMMENT ON COLUMN chat_session.id IS '主键ID';
COMMENT ON COLUMN chat_session.user_id IS '用户ID';
COMMENT ON COLUMN chat_session.title IS '会话标题';
COMMENT ON COLUMN chat_session.create_time IS '创建时间';
COMMENT ON COLUMN chat_session.update_time IS '更新时间';
COMMENT ON COLUMN chat_session.deleted IS '是否删除（0-未删除，1-已删除）';

CREATE INDEX IF NOT EXISTS idx_chat_session_user_id ON chat_session(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_deleted ON chat_session(deleted);

-- 对话消息表
CREATE TABLE IF NOT EXISTS chat_message (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted SMALLINT DEFAULT 0
);

COMMENT ON TABLE chat_message IS '对话消息表';
COMMENT ON COLUMN chat_message.id IS '主键ID';
COMMENT ON COLUMN chat_message.session_id IS '会话ID';
COMMENT ON COLUMN chat_message.role IS '角色 (user/assistant/system)';
COMMENT ON COLUMN chat_message.content IS '消息内容';
COMMENT ON COLUMN chat_message.token_count IS 'token数量';
COMMENT ON COLUMN chat_message.create_time IS '创建时间';
COMMENT ON COLUMN chat_message.update_time IS '更新时间';
COMMENT ON COLUMN chat_message.deleted IS '是否删除（0-未删除，1-已删除）';

CREATE INDEX IF NOT EXISTS idx_chat_message_session_id ON chat_message(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_create_time ON chat_message(create_time);
CREATE INDEX IF NOT EXISTS idx_chat_message_deleted ON chat_message(deleted);
