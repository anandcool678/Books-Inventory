package com.bookscatalogue.controller;

import com.bookscatalogue.dto.IsbnRequest;
import com.bookscatalogue.entity.Book;
import com.bookscatalogue.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
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

    @PatchMapping("{bookId}/update")
    public ResponseEntity<Book> updateBook(@PathVariable String bookId, @Valid @RequestBody Book book, Principal principal){
        String currentUserEmail = principal.getName();
        Book updatedBook = bookService.updateBook(bookId, book, currentUserEmail);
        return ResponseEntity.ok(updatedBook);
    }

    @GetMapping("/myTBR")
    public ResponseEntity<List<Book>> getMyTBR(Principal principal) {
        List<Book> books = bookService.getTBRByCurrentUser(principal.getName());
        return ResponseEntity.ok(books);
    }
}
