package com.dealerpro.repository;

import com.dealerpro.entity.HsnGstRate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HsnGstRateRepository extends JpaRepository<HsnGstRate, Long> {

    /** Code prefix matches first, then description keywords; shortest codes first. */
    @Query("""
        SELECT h FROM HsnGstRate h
        WHERE (:query = '' OR h.hsnCode LIKE CONCAT(:query, '%')
                           OR LOWER(h.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY
            CASE WHEN h.hsnCode LIKE CONCAT(:query, '%') THEN 0 ELSE 1 END,
            LENGTH(h.hsnCode),
            h.hsnCode,
            h.id
        """)
    Page<HsnGstRate> search(@Param("query") String query, Pageable pageable);

    List<HsnGstRate> findByHsnCodeOrderByIdAsc(String hsnCode);
}
