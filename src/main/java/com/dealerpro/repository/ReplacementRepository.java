
package com.dealerpro.repository;

import com.dealerpro.entity.Replacement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ReplacementRepository extends JpaRepository<Replacement, Long> {

    // Used when the customer-name search is empty
    @Query("SELECT r FROM Replacement r WHERE " +
           "(:from IS NULL OR r.replacementDate >= :from) AND " +
           "(:to IS NULL OR r.replacementDate <= :to) AND " +
           "(:createdBy IS NULL OR r.createdBy = :createdBy)")
    Page<Replacement> findByFiltersWithoutCustomerName(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("createdBy") Long createdBy,
            Pageable pageable);

    // Used when the customer-name search contains text
    @Query("SELECT r FROM Replacement r WHERE " +
           "(:from IS NULL OR r.replacementDate >= :from) AND " +
           "(:to IS NULL OR r.replacementDate <= :to) AND " +
           "LOWER(r.customerName) LIKE LOWER(CONCAT('%', :customer, '%')) AND " +
           "(:createdBy IS NULL OR r.createdBy = :createdBy)")
    Page<Replacement> findByFiltersWithCustomerName(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("customer") String customer,
            @Param("createdBy") Long createdBy,
            Pageable pageable);

    long countByCreatedBy(Long createdBy);
}
