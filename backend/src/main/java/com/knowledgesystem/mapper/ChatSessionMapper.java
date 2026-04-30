package com.knowledgesystem.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.knowledgesystem.entity.ChatSession;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatSessionMapper extends BaseMapper<ChatSession> {
}
