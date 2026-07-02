package com.dealerpro.repository;

import com.dealerpro.entity.Replacement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ReplacementRepository extends JpaRepository<Replacement, Long> {

    @Query("SELECT r FROM Replacement r WHERE " +
           "(:from IS NULL OR r.replacementDate >= :from) AND " +
           "(:to IS NULL OR r.replacementDate <= :to) AND " +
           "(:customer IS NULL OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :customer, '%'))) AND " +
           "(:createdBy IS NULL OR r.createdBy = :createdBy)")
    Page<Replacement> findByFilters(@Param("from") LocalDate from,
                                     @Param("to") LocalDate to,
                                     @Param("customer") String customer,
                                     @Param("createdBy") Long createdBy,
                                     Pageable pageable);

    long countByCreatedBy(Long createdBy);
}
