package com.knowledgesystem.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinIOService {

    private final MinioClient minioClient;
    private final com.knowledgesystem.config.MinIOConfig minIOConfig;

    public void createBucketIfNotExists() {
        try {
            String bucketName = minIOConfig.getBucketName();
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("创建 MinIO Bucket: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("检查或创建 MinIO Bucket 失败", e);
            throw new RuntimeException("检查或创建 MinIO Bucket 失败: " + e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String fileName) {
        try {
            createBucketIfNotExists();
            String bucketName = minIOConfig.getBucketName();
            
            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(fileName)
                                .stream(inputStream, file.getSize(), minIOConfig.getPartSize())
                                .contentType(file.getContentType())
                                .build()
                );
            }
            
            log.info("文件上传到 MinIO 成功: {}", fileName);
            return fileName;
        } catch (Exception e) {
            log.error("上传文件到 MinIO 失败: {}", fileName, e);
            throw new RuntimeException("上传文件到 MinIO 失败: " + e.getMessage());
        }
    }

    public String generatePresignedUrl(String fileName, int expiryDays) {
        try {
            String bucketName = minIOConfig.getBucketName();
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(fileName)
                            .expiry(expiryDays, TimeUnit.DAYS)
                            .build()
            );
        } catch (Exception e) {
            log.error("生成预签名 URL 失败: {}", fileName, e);
            throw new RuntimeException("生成预签名 URL 失败: " + e.getMessage());
        }
    }

    public boolean deleteFile(String fileName) {
        try {
            String bucketName = minIOConfig.getBucketName();
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
            log.info("从 MinIO 删除文件成功: {}", fileName);
            return true;
        } catch (Exception e) {
            log.error("从 MinIO 删除文件失败: {}", fileName, e);
            return false;
        }
    }

    public InputStream getFile(String fileName) {
        try {
            String bucketName = minIOConfig.getBucketName();
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
        } catch (Exception e) {
            log.error("从 MinIO 获取文件失败: {}", fileName, e);
            throw new RuntimeException("从 MinIO 获取文件失败: " + e.getMessage());
        }
    }

    public boolean fileExists(String fileName) {
        try {
            String bucketName = minIOConfig.getBucketName();
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String generateUniqueFileName(String originalFilename) {
        String extension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex != -1) {
            extension = originalFilename.substring(lastDotIndex);
        }
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid + extension;
    }
}
