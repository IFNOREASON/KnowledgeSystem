package com.knowledgesystem.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.knowledgesystem.entity.User;

import java.util.Map;

public interface UserService extends IService<User> {

    User getUserById(Long id);

    User getUserByUsername(String username);

    boolean updateUserInfo(Long id, Map<String, Object> updateParams);

    boolean clearUserData(Long userId);

    Map<String, Object> exportUserData(Long userId);

    boolean updateLastLoginTime(Long userId);
}
