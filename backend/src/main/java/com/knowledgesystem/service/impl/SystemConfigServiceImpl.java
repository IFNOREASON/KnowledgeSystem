package com.knowledgesystem.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.knowledgesystem.entity.SystemConfig;
import com.knowledgesystem.mapper.SystemConfigMapper;
import com.knowledgesystem.service.SystemConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class SystemConfigServiceImpl extends ServiceImpl<SystemConfigMapper, SystemConfig> implements SystemConfigService {

    private static final String THEME_KEY = "app.theme";
    private static final String DEFAULT_THEME = "light";

    @Override
    public String getTheme() {
        String theme = getConfigByKey(THEME_KEY);
        return theme != null ? theme : DEFAULT_THEME;
    }

    @Override
    @Transactional
    public void setTheme(String theme) {
        if (!"light".equals(theme) && !"dark".equals(theme)) {
            throw new IllegalArgumentException("Invalid theme value: " + theme);
        }
        setConfig(THEME_KEY, theme, "应用主题设置 (light/dark)");
    }

    @Override
    public String getConfigByKey(String key) {
        LambdaQueryWrapper<SystemConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemConfig::getConfigKey, key)
               .eq(SystemConfig::getIsPublic, 1);
        SystemConfig config = this.getOne(wrapper);
        return config != null ? config.getConfigValue() : null;
    }

    @Override
    @Transactional
    public void setConfig(String key, String value, String description) {
        LambdaQueryWrapper<SystemConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemConfig::getConfigKey, key);
        SystemConfig existing = this.getOne(wrapper);
        
        if (existing != null) {
            existing.setConfigValue(value);
            if (description != null && !description.isEmpty()) {
                existing.setDescription(description);
            }
            this.updateById(existing);
            log.info("Updated config: {} = {}", key, value);
        } else {
            SystemConfig newConfig = new SystemConfig();
            newConfig.setConfigKey(key);
            newConfig.setConfigValue(value);
            newConfig.setDescription(description);
            newConfig.setIsPublic(1);
            this.save(newConfig);
            log.info("Created new config: {} = {}", key, value);
        }
    }
}
