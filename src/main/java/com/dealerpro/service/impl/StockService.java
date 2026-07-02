package com.dealerpro.service.impl;

import com.dealerpro.dto.request.StockRequest;
import com.dealerpro.entity.Stock;
import com.dealerpro.entity.enums.StockStatus;
import com.dealerpro.exception.BusinessException;
import com.dealerpro.exception.DuplicateResourceException;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.StockRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final CurrentUserService currentUser;

    @Transactional
    public Stock create(StockRequest req) {
        if (stockRepository.existsBySku(req.getSku())) {
            throw new DuplicateResourceException("SKU already exists: " + req.getSku());
        }
        Stock stock = Stock.builder()
                .itemName(req.getItemName()).sku(req.getSku())
                .rate(req.getRate()).category(req.getCategory())
                .brand(req.getBrand())
                .status(req.getStatus() != null ? req.getStatus() : StockStatus.AVAILABLE)
                .barcode(req.getBarcode())
                .unit(req.getUnit() != null ? req.getUnit() : "PCS")
                .quantity(req.getQuantity() != null ? req.getQuantity() : 1)
                .hsnCode(req.getHsnCode()).purchaseDate(req.getPurchaseDate())
                .supplier(req.getSupplier()).location(req.getLocation())
                .notes(req.getNotes())
                .build();
        return stockRepository.save(stock);
    }

    /**
     * @param requestedUserId optional — only honored for admins (to filter by a
     *                         specific user's data); non-admins always see only
     *                         their own records regardless of this value.
     */
    public Page<Stock> findAll(StockStatus status, String name, Long requestedUserId,
                                int page, int size, String sort) {
        Sort s = sort != null && sort.equals("rate_asc")  ? Sort.by("rate").ascending()
               : sort != null && sort.equals("rate_desc") ? Sort.by("rate").descending()
               : Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, s);
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return stockRepository.findByFilters(status, name, createdBy, pageable);
    }

    public Stock findById(Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", id));
        assertAccessible(stock.getCreatedBy());
        return stock;
    }

    @Transactional
    public Stock update(Long id, StockRequest req) {
        Stock stock = findById(id); // already enforces ownership
        if (!stock.getSku().equals(req.getSku()) && stockRepository.existsBySku(req.getSku())) {
            throw new DuplicateResourceException("SKU already exists: " + req.getSku());
        }
        stock.setItemName(req.getItemName()); stock.setSku(req.getSku());
        stock.setRate(req.getRate());         stock.setCategory(req.getCategory());
        stock.setBrand(req.getBrand());       stock.setStatus(req.getStatus());
        stock.setBarcode(req.getBarcode());   stock.setUnit(req.getUnit());
        stock.setQuantity(req.getQuantity()); stock.setHsnCode(req.getHsnCode());
        stock.setPurchaseDate(req.getPurchaseDate()); stock.setSupplier(req.getSupplier());
        stock.setLocation(req.getLocation()); stock.setNotes(req.getNotes());
        return stockRepository.save(stock);
    }

    @Transactional
    public void delete(Long id) {
        Stock stock = findById(id); // already enforces ownership
        if (stock.getStatus() == StockStatus.SOLD) {
            throw new BusinessException("Cannot delete a sold item");
        }
        stockRepository.delete(stock);
    }

    public long countByStatus(StockStatus status, Long requestedUserId) {
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);
        return stockRepository.countByFilters(status, createdBy);
    }

    /** Throws if a non-admin tries to access another user's record by ID. */
    private void assertAccessible(Long ownerId) {
        if (!currentUser.isAdmin() && !ownerId.equals(currentUser.getUserId())) {
            throw new ResourceNotFoundException("Stock"); // hide existence from other users
        }
    }
}
