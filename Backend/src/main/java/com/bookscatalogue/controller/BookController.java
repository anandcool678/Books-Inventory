package com.bookscatalogue.controller;

import com.bookscatalogue.dto.IsbnRequest;
import com.bookscatalogue.entity.Book;
import com.bookscatalogue.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping("/isbn")
    public ResponseEntity<Book> fetchBookByIsbn(@Valid @RequestBody IsbnRequest request, Principal principal) {
        String currentUserEmail = principal.getName();
        Book book = bookService.fetchAndSaveBook(request.getIsbn(), currentUserEmail);
        return ResponseEntity.ok(book);
    }

    @GetMapping("/my-books")
    public ResponseEntity<List<Book>> getMyBooks(Principal principal) {
        List<Book> books = bookService.getBooksByCurrentUser(principal.getName());
        return ResponseEntity.ok(books);
    }
}
