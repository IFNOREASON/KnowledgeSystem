package com.knowledgesystem.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.knowledgesystem.entity.User;
import com.knowledgesystem.mapper.UserMapper;
import com.knowledgesystem.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public User getUserById(Long id) {
        if (id == null) {
            throw new RuntimeException("用户ID不能为空");
        }
        User user = getById(id);
        if (user == null || user.getDeleted() == 1) {
            throw new RuntimeException("用户不存在或已被删除");
        }
        return user;
    }

    @Override
    public User getUserByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            throw new RuntimeException("用户名不能为空");
        }
        return getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .eq(User::getDeleted, 0));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateUserInfo(Long id, Map<String, Object> updateParams) {
        if (id == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        User user = getUserById(id);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, id);

        boolean hasUpdates = false;

        if (updateParams.containsKey("nickname")) {
            String nickname = (String) updateParams.get("nickname");
            if (nickname != null && nickname.length() <= 50) {
                updateWrapper.set(User::getNickname, nickname);
                hasUpdates = true;
            }
        }

        if (updateParams.containsKey("email")) {
            String email = (String) updateParams.get("email");
            if (email != null && email.length() <= 100) {
                updateWrapper.set(User::getEmail, email);
                hasUpdates = true;
            }
        }

        if (updateParams.containsKey("phone")) {
            String phone = (String) updateParams.get("phone");
            if (phone != null && phone.length() <= 20) {
                updateWrapper.set(User::getPhone, phone);
                hasUpdates = true;
            }
        }

        if (updateParams.containsKey("avatar")) {
            String avatar = (String) updateParams.get("avatar");
            if (avatar != null && avatar.length() <= 500) {
                updateWrapper.set(User::getAvatar, avatar);
                hasUpdates = true;
            }
        }

        if (updateParams.containsKey("gender")) {
            Object genderObj = updateParams.get("gender");
            if (genderObj != null) {
                Integer gender = null;
                if (genderObj instanceof Integer) {
                    gender = (Integer) genderObj;
                } else if (genderObj instanceof Number) {
                    gender = ((Number) genderObj).intValue();
                }
                if (gender != null && gender >= 0 && gender <= 2) {
                    updateWrapper.set(User::getGender, gender);
                    hasUpdates = true;
                }
            }
        }

        if (updateParams.containsKey("birthday")) {
            Object birthdayObj = updateParams.get("birthday");
            if (birthdayObj != null) {
                try {
                    LocalDate birthday = LocalDate.parse(birthdayObj.toString());
                    updateWrapper.set(User::getBirthday, birthday);
                    hasUpdates = true;
                } catch (Exception e) {
                    log.warn("生日格式解析失败: {}", birthdayObj);
                }
            }
        }

        if (updateParams.containsKey("bio")) {
            String bio = (String) updateParams.get("bio");
            if (bio != null && bio.length() <= 500) {
                updateWrapper.set(User::getBio, bio);
                hasUpdates = true;
            }
        }

        if (!hasUpdates) {
            return true;
        }

        updateWrapper.set(User::getUpdateTime, LocalDateTime.now());
        boolean result = update(updateWrapper);
        if (result) {
            log.info("用户信息更新成功，ID: {}", id);
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean clearUserData(Long userId) {
        if (userId == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        User user = getUserById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId);
        updateWrapper.set(User::getNickname, null);
        updateWrapper.set(User::getEmail, null);
        updateWrapper.set(User::getPhone, null);
        updateWrapper.set(User::getAvatar, null);
        updateWrapper.set(User::getGender, 0);
        updateWrapper.set(User::getBirthday, null);
        updateWrapper.set(User::getBio, null);
        updateWrapper.set(User::getUpdateTime, LocalDateTime.now());

        boolean result = update(updateWrapper);
        if (result) {
            log.info("用户数据清理成功，ID: {}", userId);
        }
        return result;
    }

    @Override
    public Map<String, Object> exportUserData(Long userId) {
        if (userId == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        User user = getUserById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        Map<String, Object> userData = new LinkedHashMap<>();

        Map<String, Object> basicInfo = new LinkedHashMap<>();
        basicInfo.put("id", user.getId());
        basicInfo.put("username", user.getUsername());
        basicInfo.put("nickname", user.getNickname());
        basicInfo.put("email", user.getEmail());
        basicInfo.put("phone", user.getPhone());
        basicInfo.put("avatar", user.getAvatar());
        basicInfo.put("gender", getGenderText(user.getGender()));
        basicInfo.put("birthday", user.getBirthday() != null ? user.getBirthday().toString() : null);
        basicInfo.put("bio", user.getBio());
        basicInfo.put("status", user.getStatus() == 1 ? "正常" : "禁用");
        basicInfo.put("createTime", user.getCreateTime() != null ? user.getCreateTime().toString() : null);
        basicInfo.put("lastLoginTime", user.getLastLoginTime() != null ? user.getLastLoginTime().toString() : null);
        userData.put("basicInfo", basicInfo);

        Map<String, Object> exportInfo = new LinkedHashMap<>();
        exportInfo.put("exportTime", LocalDateTime.now().toString());
        exportInfo.put("dataSource", "HXmind Knowledge System");
        userData.put("exportInfo", exportInfo);

        log.info("用户数据导出成功，ID: {}", userId);
        return userData;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateLastLoginTime(Long userId) {
        if (userId == null) {
            return false;
        }

        LambdaUpdateWrapper<User> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(User::getId, userId);
        updateWrapper.set(User::getLastLoginTime, LocalDateTime.now());
        updateWrapper.set(User::getUpdateTime, LocalDateTime.now());

        return update(updateWrapper);
    }

    private String getGenderText(Integer gender) {
        if (gender == null) {
            return "未知";
        }
        switch (gender) {
            case 1:
                return "男";
            case 2:
                return "女";
            default:
                return "未知";
        }
    }
}
