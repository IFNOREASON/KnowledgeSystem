package com.knowledgesystem.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.knowledgesystem.entity.FileInfo;
import com.knowledgesystem.mapper.FileInfoMapper;
import com.knowledgesystem.service.FileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileServiceImpl extends ServiceImpl<FileInfoMapper, FileInfo> implements FileService {

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    private DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");

    @PostConstruct
    public void init() {
        try {
            Path path = Paths.get(uploadPath);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("创建文件上传目录: {}", uploadPath);
            }
        } catch (IOException e) {
            log.error("创建文件上传目录失败: {}", uploadPath, e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FileInfo uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("文件不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)) {
            throw new RuntimeException("文件名不能为空");
        }

        String fileExtension = getFileExtension(originalFilename);
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        String datePath = LocalDateTime.now().format(dateFormatter);
        String targetDir = uploadPath + File.separator + datePath;

        try {
            Path dirPath = Paths.get(targetDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String storedFileName = generateFileName(originalFilename);
            String filePath = targetDir + File.separator + storedFileName;

            byte[] fileBytes = file.getBytes();
            String md5 = DigestUtils.md5DigestAsHex(fileBytes);

            FileInfo existingFile = getOne(new LambdaQueryWrapper<FileInfo>()
                    .eq(FileInfo::getMd5, md5)
                    .eq(FileInfo::getDeleted, 0));

            if (existingFile != null) {
                log.info("文件已存在，MD5: {}", md5);
                return existingFile;
            }

            file.transferTo(new File(filePath));

            FileInfo fileInfo = new FileInfo();
            fileInfo.setFileName(storedFileName);
            fileInfo.setOriginalName(originalFilename);
            fileInfo.setFilePath(filePath);
            fileInfo.setFileSize(fileSize);
            fileInfo.setContentType(contentType);
            fileInfo.setFileExtension(fileExtension);
            fileInfo.setMd5(md5);
            fileInfo.setUploadTime(LocalDateTime.now());
            fileInfo.setUpdateTime(LocalDateTime.now());
            fileInfo.setDeleted(0);

            save(fileInfo);
            log.info("文件上传成功，ID: {}, 文件名: {}", fileInfo.getId(), originalFilename);

            return fileInfo;
        } catch (IOException e) {
            log.error("文件上传失败: {}", originalFilename, e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public FileInfo getFileInfo(Long id) {
        if (id == null) {
            throw new RuntimeException("文件ID不能为空");
        }

        FileInfo fileInfo = getById(id);
        if (fileInfo == null || fileInfo.getDeleted() == 1) {
            throw new RuntimeException("文件不存在或已被删除");
        }

        return fileInfo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteFile(Long id) {
        FileInfo fileInfo = getFileInfo(id);
        if (fileInfo == null) {
            return false;
        }

        try {
            File file = new File(fileInfo.getFilePath());
            if (file.exists() && file.isFile()) {
                boolean deleted = file.delete();
                if (!deleted) {
                    log.warn("物理文件删除失败: {}", fileInfo.getFilePath());
                }
            }

            boolean result = removeById(id);
            if (result) {
                log.info("文件删除成功，ID: {}", id);
            }
            return result;
        } catch (Exception e) {
            log.error("文件删除失败，ID: {}", id, e);
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }

    @Override
    public List<FileInfo> listAllFiles() {
        return list(new LambdaQueryWrapper<FileInfo>()
                .eq(FileInfo::getDeleted, 0)
                .orderByDesc(FileInfo::getUploadTime));
    }

    private String getFileExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "";
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return fileName.substring(lastDotIndex);
    }

    private String generateFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String timestamp = String.valueOf(System.currentTimeMillis());
        return timestamp + "_" + uuid + extension;
    }
}
