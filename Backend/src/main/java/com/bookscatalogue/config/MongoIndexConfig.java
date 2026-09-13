package com.bookscatalogue.config;

import com.bookscatalogue.entity.Book;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;

@Configuration
public class MongoIndexConfig {

    @Bean
    public org.springframework.boot.CommandLineRunner initializeBookIndexes(MongoTemplate mongoTemplate) {
        return args -> {
            var indexOps = mongoTemplate.indexOps(Book.class);
            for (IndexInfo indexInfo : indexOps.getIndexInfo()) {
                String name = indexInfo.getName();
                if ("isbn".equals(name) || "createdBy".equals(name) || "userId".equals(name)) {
                    indexOps.dropIndex(name);
                }
            }

            indexOps.ensureIndex(new Index().on("isbn", Sort.Direction.ASC));
            indexOps.ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        };
    }
}
