package com.dealerpro.service.impl;

import com.dealerpro.dto.request.ReplacementRequest;
import com.dealerpro.entity.Replacement;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.ReplacementRepository;
import com.dealerpro.repository.StockRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ReplacementService {

    private final ReplacementRepository replacementRepository;
    private final StockRepository       stockRepository;
    private final CurrentUserService    currentUser;

    @Transactional
    public Replacement create(ReplacementRequest req) {
        Replacement r = Replacement.builder()
                .customerName(req.getCustomerName()).customerPhone(req.getCustomerPhone())
                .givenItemName(req.getGivenItemName()).givenSku(req.getGivenSku())
                .givenValue(req.getGivenValue() != null ? req.getGivenValue() : BigDecimal.ZERO)
                .receivedItemName(req.getReceivedItemName()).receivedSku(req.getReceivedSku())
                .receivedValue(req.getReceivedValue()    != null ? req.getReceivedValue()    : BigDecimal.ZERO)
                .differenceAmount(req.getDifferenceAmount() != null ? req.getDifferenceAmount() : BigDecimal.ZERO)
                .replacementDate(req.getReplacementDate()).notes(req.getNotes())
                .build();

        if (req.getGivenStockId() != null) {
            stockRepository.findById(req.getGivenStockId()).ifPresent(r::setGivenStock);
        }
        return replacementRepository.save(r);
    }

    public Page<Replacement> findAll(LocalDate from, LocalDate to, String customer,
                                      Long requestedUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("replacementDate").descending());
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return replacementRepository.findByFilters(from, to, customer, createdBy, pageable);
    }

    public Replacement findById(Long id) {
        Replacement r = replacementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Replacement", id));
        if (!currentUser.isAdmin() && !r.getCreatedBy().equals(currentUser.getUserId())) {
            throw new ResourceNotFoundException("Replacement");
        }
        return r;
    }

    @Transactional
    public void delete(Long id) { replacementRepository.delete(findById(id)); }
}
