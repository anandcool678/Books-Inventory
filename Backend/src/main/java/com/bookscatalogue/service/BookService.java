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

    @Value("${app.hardcover.base-url:https://api.hardcover.app/v1}")
    private String hardcoverBaseUrl;

    @Value("${app.hardcover.api-key:}")
    private String hardcoverApiKey;

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
        Map<String, Object> bookData = fetchBookDataFromHardcover(isbn);
        String source = "hardcover";

        if (bookData == null) {
            bookData = fetchBookDataFromOpenLibrary(isbn);
            source = "openlibrary";
        }

        if (bookData == null || bookData.isEmpty()) {
            throw new IllegalArgumentException("No book found for ISBN: " + isbn);
        }

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
        book.setSource(source);
        book.setRead(false);
        book.setReadOn(null);
        book.setStatus("TBR");

        LocalDateTime now = LocalDateTime.now();
        book.setCreatedAt(now);
        book.setUpdatedAt(now);

        return bookRepository.save(book);
    }

    private Map<String, Object> fetchBookDataFromHardcover(String isbn) {
        if (hardcoverApiKey == null || hardcoverApiKey.trim().isEmpty()) {
            return null;
        }

        String url = hardcoverBaseUrl + "/graphql";
        String query = "{\"query\":\"query GetBookByISBN($isbn: String!) { editions(where: { _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }] }, limit: 10) { id isbn_10 isbn_13 title subtitle pages release_date edition_format image { url } publisher { name } book { id title slug description contributions { author { id name } } } } }\",\"variables\":{\"isbn\":\"" + isbn + "\"}}";

        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.setBearerAuth(hardcoverApiKey.trim());
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(query, headers);

            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response == null || response.isEmpty()) {
                return null;
            }

            Object data = response.get("data");
            if (!(data instanceof Map<?, ?> dataMap)) {
                return null;
            }

            Object editions = dataMap.get("editions");
            if (!(editions instanceof List<?> editionList) || editionList.isEmpty()) {
                return null;
            }

            Object firstEdition = editionList.get(0);
            if (!(firstEdition instanceof Map<?, ?> editionMap)) {
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> hardcoverEdition = (Map<String, Object>) editionMap;
            Object bookInfo = hardcoverEdition.get("book");
            Map<String, Object> bookMap = new java.util.HashMap<>();
            if (bookInfo instanceof Map<?, ?> nestedBookMap) {
                @SuppressWarnings("unchecked")
                Map<String, Object> typedBookMap = (Map<String, Object>) nestedBookMap;
                bookMap = typedBookMap;
            }

            Map<String, Object> mappedBook = new java.util.HashMap<>();
            String title = hardcoverEdition.get("title") != null ? hardcoverEdition.get("title").toString() : (bookMap.get("title") != null ? bookMap.get("title").toString() : null);
            mappedBook.put("title", title);
            mappedBook.put("authors", extractHardcoverAuthorList(bookMap.get("contributions")));
            mappedBook.put("description", bookMap.get("description"));
            mappedBook.put("publishers", extractPublisherList(hardcoverEdition.get("publisher")));
            mappedBook.put("publish_date", hardcoverEdition.get("release_date"));
            mappedBook.put("number_of_pages", hardcoverEdition.get("pages"));
            mappedBook.put("subjects", new ArrayList<String>());
            mappedBook.put("languages", extractHardcoverLanguageList(null));
            mappedBook.put("cover", extractHardcoverCover(hardcoverEdition.get("image")));
            if (mappedBook.get("cover") == null) {
                mappedBook.put("cover", extractHardcoverCover(bookMap.get("image")));
            }
            return mappedBook;
        } catch (RestClientException ex) {
            return null;
        }
    }

    private Map<String, Object> fetchBookDataFromOpenLibrary(String isbn) {
        String url = openLibraryBaseUrl + "/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data";
        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class, isbn);
            if (response == null || response.isEmpty()) {
                return null;
            }

            Object rawBookData = response.get("ISBN:" + isbn);
            if (!(rawBookData instanceof Map<?, ?> bookDataMap)) {
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> bookData = (Map<String, Object>) bookDataMap;
            bookData.put("source", "openlibrary");
            return bookData;
        } catch (RestClientException ex) {
            return null;
        }
    }

    private List<String> extractNameList(Object value) {
        List<String> items = new ArrayList<>();
        if (value == null) {
            return items;
        }

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
            return items;
        }

        if (value instanceof String text && !text.isBlank()) {
            items.add(text);
        }
        return items;
    }

    private List<String> extractHardcoverAuthorList(Object value) {
        List<String> authors = new ArrayList<>();
        if (!(value instanceof List<?> list)) {
            return authors;
        }

        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Object contribution = map.get("author");
                if (contribution instanceof Map<?, ?> authorMap) {
                    Object name = authorMap.get("name");
                    if (name != null) {
                        authors.add(name.toString());
                    }
                }
            }
        }
        return authors;
    }

    private List<String> extractPublisherList(Object value) {
        List<String> publishers = new ArrayList<>();
        if (value instanceof Map<?, ?> map) {
            Object name = map.get("name");
            if (name != null) {
                publishers.add(name.toString());
            }
        }
        return publishers;
    }

    private Map<String, Object> extractHardcoverCover(Object value) {
        if (value == null) {
            return null;
        }

        Map<String, Object> cover = new java.util.HashMap<>();
        if (value instanceof String imageUrl) {
            cover.put("medium", imageUrl);
            cover.put("large", imageUrl);
            cover.put("small", imageUrl);
            return cover;
        }

        if (value instanceof Map<?, ?> map) {
            Object url = map.get("url");
            if (url != null) {
                cover.put("medium", url.toString());
                cover.put("large", url.toString());
                cover.put("small", url.toString());
                return cover;
            }
        }
        return null;
    }

    private List<Map<String, String>> extractHardcoverLanguageList(Object value) {
        if (value == null) {
            return new ArrayList<>();
        }

        List<Map<String, String>> languages = new ArrayList<>();
        Map<String, String> languageMap = new java.util.HashMap<>();
        languageMap.put("key", value.toString());
        languages.add(languageMap);
        return languages;
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
