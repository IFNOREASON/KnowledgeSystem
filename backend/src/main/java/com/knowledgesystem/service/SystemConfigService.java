package com.knowledgesystem.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.knowledgesystem.entity.SystemConfig;

public interface SystemConfigService extends IService<SystemConfig> {

    String getTheme();

    void setTheme(String theme);

    String getConfigByKey(String key);

    void setConfig(String key, String value, String description);
}
