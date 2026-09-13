package com.bookscatalogue.dto;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private String userId;
    private String email;
    private String phoneNumber;
    private String name;

    public AuthResponse(String token, String userId, String email, String phoneNumber, String name) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.name = name;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
