package com.dealerpro.repository;

import com.dealerpro.entity.HsnMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HsnMasterRepository extends JpaRepository<HsnMaster, Long> {

    /**
     * Search by code prefix first, then description keyword.
     * Uses Pageable for reliable limiting — no LIMIT in JPQL.
     * When query is blank, returns all ordered by code length (shortest/most-common first).
     */
    @Query("""
        SELECT h FROM HsnMaster h
        WHERE (:query = '' OR h.hsnCode LIKE CONCAT(:codePrefix, '%')
                           OR LOWER(h.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY
            CASE WHEN h.hsnCode LIKE CONCAT(:codePrefix, '%') THEN 0 ELSE 1 END,
            LENGTH(h.hsnCode),
            h.hsnCode
        """)
    Page<HsnMaster> search(@Param("query") String query,
                            @Param("codePrefix") String codePrefix,
                            Pageable pageable);

    /**
     * Fast exact-code lookup used by the GST rate auto-fetch.
     */
    List<HsnMaster> findByHsnCode(String hsnCode);
}
