package com.bookscatalogue.repository;

import com.bookscatalogue.entity.Book;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends MongoRepository<Book, String> {
    Optional<Book> findByIsbnAndUserId(String isbn, String userId);
    List<Book> findByUserIdOrderByCreatedAtDesc(String userId);
    boolean existsByIsbnAndUserId(String isbn, String userId);
}
