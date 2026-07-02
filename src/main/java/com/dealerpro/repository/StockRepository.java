package com.dealerpro.repository;

import com.dealerpro.entity.Stock;
import com.dealerpro.entity.enums.StockStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findBySku(String sku);
    boolean existsBySku(String sku);
    List<Stock> findByStatus(StockStatus status);
    long countByStatus(StockStatus status);

    @Query("SELECT s FROM Stock s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:name IS NULL OR LOWER(s.itemName) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(s.sku) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:createdBy IS NULL OR s.createdBy = :createdBy)")
    Page<Stock> findByFilters(@Param("status") StockStatus status,
                               @Param("name") String name,
                               @Param("createdBy") Long createdBy,
                               Pageable pageable);

    @Query("SELECT COUNT(s) FROM Stock s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:createdBy IS NULL OR s.createdBy = :createdBy)")
    long countByFilters(@Param("status") StockStatus status, @Param("createdBy") Long createdBy);
}
