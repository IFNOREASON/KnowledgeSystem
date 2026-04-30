package com.knowledgesystem.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.knowledgesystem.entity.FileInfo;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService extends IService<FileInfo> {

    FileInfo uploadFile(MultipartFile file);

    FileInfo getFileInfo(Long id);

    boolean deleteFile(Long id);

    List<FileInfo> listAllFiles();

    FileInfo renameFile(Long id, String newName);
}
