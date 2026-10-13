package com.dealerpro.repository;

import com.dealerpro.entity.SacMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SacMasterRepository extends JpaRepository<SacMaster, Long> {

    @Query("""
        SELECT s FROM SacMaster s
        WHERE (:query = '' OR s.sacCode LIKE CONCAT(:codePrefix, '%')
                           OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY
            CASE WHEN s.sacCode LIKE CONCAT(:codePrefix, '%') THEN 0 ELSE 1 END,
            LENGTH(s.sacCode),
            s.sacCode
        """)
    Page<SacMaster> search(@Param("query") String query,
                            @Param("codePrefix") String codePrefix,
                            Pageable pageable);
}
