package com.bookscatalogue.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class IsbnRequest {

    @NotBlank(message = "ISBN is required")
    @Pattern(regexp = "^(?:97[89])?[-\\s]?[0-9Xx]{10,13}$", message = "ISBN format is invalid")
    @JsonAlias({"isbnNumber", "bookIsbn", "book_isbn"})
    private String isbn;

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }
}
