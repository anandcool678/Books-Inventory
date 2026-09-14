package com.bookscatalogue.service;

import com.bookscatalogue.entity.Book;
import com.bookscatalogue.entity.User;
import com.bookscatalogue.repository.BookRepository;
import com.bookscatalogue.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final EmailService emailService;

    @Value("${app.openlibrary.base-url:https://openlibrary.org}")
    private String openLibraryBaseUrl;

    public BookService(BookRepository bookRepository, UserRepository userRepository, RestTemplate restTemplate, EmailService emailService) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.emailService = emailService;
    }

    public Book fetchAndSaveBook(String isbn, String currentUserEmail) {
        String normalizedIsbn = normalizeIsbn(isbn);
        String email = normalizeUserEmail(currentUserEmail);
        String userId = resolveUserId(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));

        if (bookRepository.existsByIsbnAndUserId(normalizedIsbn, userId)) {
            throw new IllegalArgumentException("Book already exists");
        }

        Book savedBook = saveBookFromApi(normalizedIsbn, userId);
//        emailService.sendBookAddedEmail(user.getEmail(), user.getName(), savedBook.getTitle(), savedBook.getIsbn());
        return savedBook;
    }

    public List<Book> getBooksByCurrentUser(String currentUserEmail) {
        String userId = resolveUserId(currentUserEmail);
        return bookRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private String resolveUserId(String currentUserEmail) {
        String email = normalizeUserEmail(currentUserEmail);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));
        return user.getId();
    }

    private Book saveBookFromApi(String isbn, String userId) {
        String url = openLibraryBaseUrl + "/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data";
        Map<String, Object> response;

        try {
            response = restTemplate.getForObject(url, Map.class, isbn);
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("Unable to fetch book details for ISBN: " + isbn, ex);
        }

        if (response == null || response.isEmpty()) {
            throw new IllegalArgumentException("No book found for ISBN: " + isbn);
        }

        Object rawBookData = response.get("ISBN:" + isbn);
        if (!(rawBookData instanceof Map<?, ?> bookDataMap)) {
            throw new IllegalArgumentException("No book found for ISBN: " + isbn);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> bookData = (Map<String, Object>) bookDataMap;

        Book book = new Book();
        book.setIsbn(isbn);
        book.setUserId(userId);
        book.setTitle(getStringValue(bookData, "title"));
        book.setAuthors(extractStringList(bookData.get("authors")));
        book.setDescription(extractDescription(bookData.get("description")));
        book.setPublishers(extractStringList(bookData.get("publishers")));
        book.setPublishedDate(getStringValue(bookData, "publish_date"));
        book.setPageCount(extractInteger(bookData.get("number_of_pages")));
        book.setCategories(extractStringList(bookData.get("subjects")));
        book.setLanguage(extractLanguage(bookData.get("languages")));
        book.setCoverImage(extractCoverImage(bookData.get("cover")));
        book.setSource("openlibrary");
        book.setRead(false);
        book.setReadOn(null);
        book.setStatus("TBR");

        LocalDateTime now = LocalDateTime.now();
        book.setCreatedAt(now);
        book.setUpdatedAt(now);

        return bookRepository.save(book);
    }

    private String normalizeIsbn(String isbn) {
        if (isbn == null) {
            throw new IllegalArgumentException("ISBN is required");
        }

        String clean = isbn.trim().replace("-", "").replace(" ", "");
        if (clean.isEmpty()) {
            throw new IllegalArgumentException("ISBN is required");
        }

        return clean;
    }

    private String normalizeUserEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("User is required");
        }
        return email.trim().toLowerCase();
    }

    private String getStringValue(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (value == null) {
            return null;
        }
        return value.toString();
    }

    private String extractDescription(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Map<?, ?> map) {
            Object description = map.get("value");
            return description != null ? description.toString() : null;
        }
        return value.toString();
    }

    private List<String> extractStringList(Object value) {
        List<String> items = new ArrayList<>();
        if (value instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Object name = map.get("name");
                    if (name != null) {
                        items.add(name.toString());
                    }
                } else if (item != null) {
                    items.add(item.toString());
                }
            }
        }
        return items;
    }

    private Integer extractInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private String extractLanguage(Object value) {
        if (value instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?, ?> map) {
                Object languageKey = map.get("key");
                if (languageKey != null) {
                    String raw = languageKey.toString();
                    return raw.replace("/languages/", "");
                }
            }
        }
        return null;
    }

    private String extractCoverImage(Object value) {
        if (value instanceof Map<?, ?> cover) {
            Object medium = cover.get("medium");
            if (medium != null) {
                return medium.toString();
            }
            Object large = cover.get("large");
            if (large != null) {
                return large.toString();
            }
            Object small = cover.get("small");
            if (small != null) {
                return small.toString();
            }
        }
        return null;
    }
    
    public Book updateBook(String bookId, Book book, String currentUserEmail) {
        String email = resolveUserId(normalizeUserEmail(currentUserEmail));

        Book updatedBook = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));
        updatedBook.setRead(book.isRead());
        updatedBook.setReadOn(book.getReadOn());
        updatedBook.setStatus(book.getStatus());
        if(book.getStatus().equals("read") && book.getReadOn() == null) {
            updatedBook.setReadOn(LocalDateTime.now());
        }
        else if(book.getStatus().equals("read") && book.getReadOn() != null) {
            updatedBook.setReadOn(book.getReadOn());
        }
        updatedBook.setUpdatedAt(LocalDateTime.now());
        return bookRepository.save(updatedBook);

    }

    public List<Book> getTBRByCurrentUser(String currentUserEmail){
        String userId = resolveUserId(currentUserEmail);
        List<Book> allBooks = bookRepository.findByUserIdTBR(userId);

        return allBooks;
    }
}
