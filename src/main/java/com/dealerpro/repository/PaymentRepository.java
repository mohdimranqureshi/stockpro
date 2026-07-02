package com.dealerpro.repository;

import com.dealerpro.entity.Payment;
import com.dealerpro.entity.enums.FlowType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.flowType = :type " +
           "AND (:createdBy IS NULL OR p.createdBy = :createdBy)")
    BigDecimal sumByFlowType(@Param("type") FlowType type, @Param("createdBy") Long createdBy);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:flow IS NULL OR p.flowType = :flow) AND " +
           "(:from IS NULL OR p.paymentDate >= :from) AND " +
           "(:to IS NULL OR p.paymentDate <= :to) AND " +
           "(:createdBy IS NULL OR p.createdBy = :createdBy)")
    Page<Payment> findByFilters(@Param("flow") FlowType flow,
                                 @Param("from") LocalDate from,
                                 @Param("to") LocalDate to,
                                 @Param("createdBy") Long createdBy,
                                 Pageable pageable);
}
