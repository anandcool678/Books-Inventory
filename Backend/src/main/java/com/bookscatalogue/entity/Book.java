package com.bookscatalogue.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "books")
public class Book {

    @Id
    private String id;

    @Indexed
    private String isbn;

    @Indexed
    private String userId;

    private String title;
    private List<String> authors = new ArrayList<>();
    private String description;
    private List<String> publishers = new ArrayList<>();
    private String publishedDate;
    private Integer pageCount;
    private List<String> categories = new ArrayList<>();
    private String coverImage;
    private String language;
    private String source;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isRead;
    private LocalDateTime readOn;

    public Book() {
    }

    public Book(String isbn, String userId, String title, List<String> authors, String description,
                List<String> publishers, String publishedDate, Integer pageCount,
                List<String> categories, String coverImage, String language, String source) {
        this.isbn = isbn;
        this.userId = userId;
        this.title = title;
        this.authors = authors;
        this.description = description;
        this.publishers = publishers;
        this.publishedDate = publishedDate;
        this.pageCount = pageCount;
        this.categories = categories;
        this.coverImage = coverImage;
        this.language = language;
        this.source = source;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.isRead = false;
        this.readOn = null;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getAuthors() {
        return authors;
    }

    public void setAuthors(List<String> authors) {
        this.authors = authors;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getPublishers() {
        return publishers;
    }

    public void setPublishers(List<String> publishers) {
        this.publishers = publishers;
    }

    public String getPublishedDate() {
        return publishedDate;
    }

    public void setPublishedDate(String publishedDate) {
        this.publishedDate = publishedDate;
    }

    public Integer getPageCount() {
        return pageCount;
    }

    public void setPageCount(Integer pageCount) {
        this.pageCount = pageCount;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
    public LocalDateTime getReadOn() {
        return readOn;
    }

    public void setReadOn(LocalDateTime readOn) {
        this.readOn = readOn;
    }
}
