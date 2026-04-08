package com.example.cafe.repository;

import com.example.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * UserRepository - Data Access Layer for User entity
 * 
 * Annotations explained:
 * @Repository - Marks this interface as a Spring Data repository component
 *               Enables exception translation and Spring's repository functionality
 * 
 * JpaRepository<User, Long> - Spring Data JPA interface providing:
 * - CRUD operations (save, findById, findAll, delete, etc.)
 * - Pagination and sorting support
 * - Query derivation from method names
 * - User: Entity type this repository manages
 * - Long: Type of the primary key (User.id)
 * 
 * Why extend JpaRepository instead of just Repository:
 * - JpaRepository provides more built-in methods
 * - Includes batch operations and flush operations
 * - Better integration with Spring Data JPA features
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Custom query method to find user by email
     * Spring Data JPA automatically generates the implementation based on method name
     * 
     * Method name breakdown:
     * - findBy: Prefix indicating this is a finder method
     * - Email: Property name to search by (must match field name in User entity)
     * - Optional<User>: Returns Optional to handle case when user doesn't exist
     * 
     * This generates SQL: SELECT * FROM users WHERE email = ?
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Custom query method to check if email exists
     * Returns true if user with given email exists, false otherwise
     * 
     * This generates SQL: SELECT COUNT(*) FROM users WHERE email = ? > 0
     */
    Boolean existsByEmail(String email);
}