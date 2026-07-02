package com.dealerpro.repository;

import com.dealerpro.entity.Transaction;
import com.dealerpro.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByType(TransactionType type, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:type IS NULL OR t.type = :type) AND " +
           "(:from IS NULL OR t.transactionDate >= :from) AND " +
           "(:to IS NULL OR t.transactionDate <= :to) AND " +
           "(:party IS NULL OR LOWER(t.partyName) LIKE LOWER(CONCAT('%', :party, '%'))) AND " +
           "(:createdBy IS NULL OR t.createdBy = :createdBy)")
    Page<Transaction> findByFilters(@Param("type") TransactionType type,
                                     @Param("from") LocalDate from,
                                     @Param("to") LocalDate to,
                                     @Param("party") String party,
                                     @Param("createdBy") Long createdBy,
                                     Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.finalAmount), 0) FROM Transaction t WHERE t.type = :type " +
           "AND (:createdBy IS NULL OR t.createdBy = :createdBy)")
    BigDecimal sumByType(@Param("type") TransactionType type, @Param("createdBy") Long createdBy);

    @Query("SELECT COALESCE(SUM(t.finalAmount), 0) FROM Transaction t WHERE t.type = :type " +
           "AND YEAR(t.transactionDate) = :year AND MONTH(t.transactionDate) = :month " +
           "AND (:createdBy IS NULL OR t.createdBy = :createdBy)")
    BigDecimal sumByTypeAndMonth(@Param("type") TransactionType type,
                                  @Param("year") int year,
                                  @Param("month") int month,
                                  @Param("createdBy") Long createdBy);

    @Query(value = """
        SELECT TO_CHAR(t.transaction_date, 'YYYY-MM') as month,
               SUM(CASE WHEN t.type = 'SALE' THEN t.final_amount ELSE 0 END) as sales,
               SUM(CASE WHEN t.type = 'PURCHASE' THEN t.final_amount ELSE 0 END) as purchases
        FROM transactions t
        WHERE (:year IS NULL OR EXTRACT(YEAR FROM t.transaction_date) = :year)
          AND (:createdBy IS NULL OR t.created_by = :createdBy)
        GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<Object[]> getMonthlyProfitLoss(@Param("year") Integer year, @Param("createdBy") Long createdBy);

    List<Transaction> findTop5ByCreatedByOrderByCreatedAtDesc(Long createdBy);
    List<Transaction> findTop5ByOrderByCreatedAtDesc();
}
