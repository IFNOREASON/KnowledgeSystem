package com.knowledgesystem.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.knowledgesystem.config.MinIOConfig;
import com.knowledgesystem.entity.FileInfo;
import com.knowledgesystem.mapper.FileInfoMapper;
import com.knowledgesystem.service.FileService;
import com.knowledgesystem.service.MinIOService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl extends ServiceImpl<FileInfoMapper, FileInfo> implements FileService {

    private final MinIOService minioService;
    private final MinIOConfig minIOConfig;

    private static final int PRESIGNED_URL_EXPIRY_DAYS = 7;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/markdown",
            "text/plain",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/bmp",
            "image/webp",
            "video/mp4",
            "video/avi",
            "video/mpeg",
            "video/quicktime",
            "video/x-ms-wmv",
            "video/x-flv",
            "video/webm"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".pdf", ".doc", ".docx", ".ppt", ".pptx",
            ".md", ".txt",
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
            ".mp4", ".avi", ".mpeg", ".mov", ".wmv", ".flv", ".webm"
    );

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

        validateFileType(file);

        String fileExtension = getFileExtension(originalFilename);
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        try {
            byte[] fileBytes = file.getBytes();
            String md5 = DigestUtils.md5DigestAsHex(fileBytes);

            FileInfo existingFile = getOne(new LambdaQueryWrapper<FileInfo>()
                    .eq(FileInfo::getMd5, md5)
                    .eq(FileInfo::getDeleted, 0));

            if (existingFile != null) {
                log.info("文件已存在，MD5: {}", md5);
                return enrichFileInfoWithUrl(existingFile);
            }

            String objectName = minioService.generateUniqueFileName(originalFilename);

            minioService.uploadFile(file, objectName);

            FileInfo fileInfo = new FileInfo();
            fileInfo.setFileName(objectName);
            fileInfo.setOriginalName(originalFilename);
            fileInfo.setFilePath("");
            fileInfo.setFileSize(fileSize);
            fileInfo.setContentType(contentType);
            fileInfo.setFileExtension(fileExtension);
            fileInfo.setMd5(md5);
            fileInfo.setStorageType("minio");
            fileInfo.setBucketName(minIOConfig.getBucketName());
            fileInfo.setObjectName(objectName);
            fileInfo.setAccessUrl(null);
            fileInfo.setUploadTime(LocalDateTime.now());
            fileInfo.setUpdateTime(LocalDateTime.now());
            fileInfo.setDeleted(0);

            save(fileInfo);
            log.info("文件上传成功，ID: {}, 文件名: {}, 存储类型: minio, 对象名: {}", 
                    fileInfo.getId(), originalFilename, objectName);

            return enrichFileInfoWithUrl(fileInfo);
        } catch (Exception e) {
            log.error("文件上传失败: {}", originalFilename, e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    private void validateFileType(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename).toLowerCase();
        String contentType = file.getContentType();

        boolean extensionAllowed = ALLOWED_EXTENSIONS.contains(extension);
        boolean contentTypeAllowed = (contentType != null && ALLOWED_TYPES.stream()
                .anyMatch(allowed -> contentType.startsWith(allowed.split("/")[0] + "/") || 
                        allowed.equals(contentType)));

        if (!extensionAllowed && !contentTypeAllowed) {
            throw new RuntimeException("不支持的文件类型。支持的类型：文档(pdf/doc/docx/ppt/pptx/md/txt)、图片、视频");
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

        return enrichFileInfoWithUrl(fileInfo);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteFile(Long id) {
        FileInfo fileInfo = getById(id);
        if (fileInfo == null || fileInfo.getDeleted() == 1) {
            return false;
        }

        try {
            if ("minio".equals(fileInfo.getStorageType()) && StringUtils.hasText(fileInfo.getObjectName())) {
                minioService.deleteFile(fileInfo.getObjectName());
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
        List<FileInfo> files = list(new LambdaQueryWrapper<FileInfo>()
                .eq(FileInfo::getDeleted, 0)
                .orderByDesc(FileInfo::getUploadTime));
        
        return files.stream()
                .map(this::enrichFileInfoWithUrl)
                .collect(Collectors.toList());
    }

    private FileInfo enrichFileInfoWithUrl(FileInfo fileInfo) {
        if ("minio".equals(fileInfo.getStorageType()) && StringUtils.hasText(fileInfo.getObjectName())) {
            try {
                String presignedUrl = minioService.generatePresignedUrl(
                        fileInfo.getObjectName(), 
                        PRESIGNED_URL_EXPIRY_DAYS
                );
                fileInfo.setAccessUrl(presignedUrl);
            } catch (Exception e) {
                log.warn("为文件生成预签名 URL 失败，ID: {}, 对象名: {}", 
                        fileInfo.getId(), fileInfo.getObjectName(), e);
            }
        }
        return fileInfo;
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
}
