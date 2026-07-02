package com.dealerpro.service.impl;

import com.dealerpro.dto.request.PaymentRequest;
import com.dealerpro.entity.Payment;
import com.dealerpro.entity.enums.FlowType;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.PaymentRepository;
import com.dealerpro.repository.TransactionRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final CurrentUserService currentUser;

    @Transactional
    public Payment create(PaymentRequest req) {
        Payment payment = Payment.builder()
                .flowType(req.getFlowType()).amount(req.getAmount())
                .paymentDate(req.getPaymentDate()).partyName(req.getPartyName())
                .paymentMode(req.getPaymentMode()).referenceNo(req.getReferenceNo())
                .category(req.getCategory() != null ? req.getCategory() : "PRODUCT")
                .notes(req.getNotes()).build();

        if (req.getTransactionId() != null) {
            var tx = transactionRepository.findById(req.getTransactionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transaction", req.getTransactionId()));
            payment.setTransaction(tx);
        }
        return paymentRepository.save(payment);
    }

    public Page<Payment> findAll(FlowType flow, LocalDate from, LocalDate to,
                                  Long requestedUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("paymentDate").descending());
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return paymentRepository.findByFilters(flow, from, to, createdBy, pageable);
    }

    public Payment findById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
        if (!currentUser.isAdmin() && !payment.getCreatedBy().equals(currentUser.getUserId())) {
            throw new ResourceNotFoundException("Payment");
        }
        return payment;
    }

    public BigDecimal totalInflow(Long requestedUserId) {
        return paymentRepository.sumByFlowType(FlowType.INFLOW, currentUser.resolveDataFilter(requestedUserId));
    }

    public BigDecimal totalOutflow(Long requestedUserId) {
        return paymentRepository.sumByFlowType(FlowType.OUTFLOW, currentUser.resolveDataFilter(requestedUserId));
    }

    @Transactional
    public void delete(Long id) { paymentRepository.delete(findById(id)); }
}
