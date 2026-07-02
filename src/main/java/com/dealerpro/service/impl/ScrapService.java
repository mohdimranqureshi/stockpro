package com.dealerpro.service.impl;

import com.dealerpro.dto.request.ScrapRequest;
import com.dealerpro.entity.Scrap;
import com.dealerpro.entity.enums.ScrapStatus;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.ScrapRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final CurrentUserService currentUser;

    @Transactional
    public Scrap create(ScrapRequest req) {
        return scrapRepository.save(Scrap.builder()
                .itemName(req.getItemName()).sku(req.getSku())
                .barcode(req.getBarcode())
                .estimatedValue(req.getEstimatedValue())
                .soldValue(req.getSoldValue())
                .status(req.getStatus() != null ? req.getStatus() : ScrapStatus.TAGGED_FOR_SALE)
                .scrapDate(req.getScrapDate()).source(req.getSource())
                .buyerName(req.getBuyerName()).notes(req.getNotes())
                .build());
    }

    public Page<Scrap> findAll(ScrapStatus status, Long requestedUserId, int page, int size) {
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return scrapRepository.findByFilters(status, createdBy, PageRequest.of(page, size, Sort.by("scrapDate").descending()));
    }

    public Scrap findById(Long id) {
        Scrap scrap = scrapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scrap", id));
        if (!currentUser.isAdmin() && !scrap.getCreatedBy().equals(currentUser.getUserId())) {
            throw new ResourceNotFoundException("Scrap");
        }
        return scrap;
    }

    @Transactional
    public Scrap update(Long id, ScrapRequest req) {
        Scrap scrap = findById(id); // enforces ownership
        scrap.setItemName(req.getItemName()); scrap.setSku(req.getSku());
        scrap.setBarcode(req.getBarcode());   scrap.setEstimatedValue(req.getEstimatedValue());
        scrap.setSoldValue(req.getSoldValue()); scrap.setStatus(req.getStatus());
        scrap.setScrapDate(req.getScrapDate()); scrap.setSource(req.getSource());
        scrap.setBuyerName(req.getBuyerName()); scrap.setNotes(req.getNotes());
        return scrapRepository.save(scrap);
    }

    @Transactional
    public void delete(Long id) { scrapRepository.delete(findById(id)); }

    public long countByStatus(ScrapStatus status, Long requestedUserId) {
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return createdBy == null
                ? scrapRepository.countByStatus(status)
                : scrapRepository.countByStatusAndCreatedBy(status, createdBy);
    }
}
