package com.example.cafe.dto;

public class CafeImageDto {
    private String caption;
    private Boolean isPrimary;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private String fileData;
    
    // Getters and Setters
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    
    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public String getFileData() { return fileData; }
    public void setFileData(String fileData) { this.fileData = fileData; }
}