package com.dealerpro.repository;

import com.dealerpro.entity.Scrap;
import com.dealerpro.entity.enums.ScrapStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {
    long countByStatus(ScrapStatus status);
    long countByStatusAndCreatedBy(ScrapStatus status, Long createdBy);

    @Query("SELECT s FROM Scrap s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:createdBy IS NULL OR s.createdBy = :createdBy)")
    Page<Scrap> findByFilters(@Param("status") ScrapStatus status,
                               @Param("createdBy") Long createdBy,
                               Pageable pageable);
}
