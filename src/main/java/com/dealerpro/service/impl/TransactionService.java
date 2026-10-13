package com.dealerpro.service.impl;

import com.dealerpro.dto.request.TransactionRequest;
import com.dealerpro.entity.Stock;
import com.dealerpro.entity.Transaction;
import com.dealerpro.entity.enums.StockStatus;
import com.dealerpro.entity.enums.TransactionType;
import com.dealerpro.exception.BusinessException;
import com.dealerpro.exception.ResourceNotFoundException;
import com.dealerpro.repository.StockRepository;
import com.dealerpro.repository.TransactionRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

	private final TransactionRepository transactionRepository;
	private final StockRepository stockRepository;
	private final CurrentUserService currentUser;

	public String nextInvoiceNumber() {
		return transactionRepository.nextInvoiceNumber();
	}

	@Transactional
	public Transaction create(TransactionRequest req) {
		Stock stock = null;
		if (req.getStockId() != null) {
			stock = stockRepository.findById(req.getStockId())
					.orElseThrow(() -> new ResourceNotFoundException("Stock", req.getStockId()));
			if (req.getType() == TransactionType.SALE && stock.getStatus() != StockStatus.AVAILABLE) {
				throw new BusinessException("Item is not available for sale. Status: " + stock.getStatus());
			}
		}

		BigDecimal finalAmount = req.getAmount()
				.subtract(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
				.add(req.getTaxAmount() != null ? req.getTaxAmount() : BigDecimal.ZERO)
				.subtract(req.getScrapDeduction() != null ? req.getScrapDeduction() : BigDecimal.ZERO);

		// Auto-assign invoice number if not provided
		String invoiceNo = (req.getInvoiceNo() != null && !req.getInvoiceNo().isBlank()) ? req.getInvoiceNo()
				: transactionRepository.nextInvoiceNumber();

		Transaction tx = Transaction.builder().type(req.getType()).stock(stock).itemName(req.getItemName())
				.sku(req.getSku()).serialNumber(req.getSerialNumber()).vehicleNumber(req.getVehicleNumber())
				.hsnCode(req.getHsnCode()).gstRate(req.getGstRate() != null ? req.getGstRate() : BigDecimal.ZERO)
				.partyName(req.getPartyName()).partyPhone(req.getPartyPhone()).partyGstin(req.getPartyGstin())
				.amount(req.getAmount()).discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
				.taxAmount(req.getTaxAmount() != null ? req.getTaxAmount() : BigDecimal.ZERO)
				.scrapType(req.getScrapType())
				.scrapWeight(req.getScrapWeight() != null ? req.getScrapWeight() : BigDecimal.ZERO)
				.scrapRate(req.getScrapRate() != null ? req.getScrapRate() : BigDecimal.ZERO)
				.scrapDeduction(req.getScrapDeduction() != null ? req.getScrapDeduction() : BigDecimal.ZERO)
				.finalAmount(finalAmount).transactionDate(req.getTransactionDate()).invoiceNo(invoiceNo)
				.paymentMode(req.getPaymentMode()).notes(req.getNotes()).build();

		tx = transactionRepository.save(tx);

		if (stock != null && req.getType() == TransactionType.SALE) {
			stock.setStatus(StockStatus.SOLD);
			stockRepository.save(stock);
		}
		return tx;
	}

	public Page<Transaction> findAll(TransactionType type, LocalDate from, LocalDate to, String party,
			Long requestedUserId, int page, int size) {
		Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());

		Long createdBy = currentUser.resolveDataFilter(requestedUserId);

		// Avoid passing a null String into the LOWER() search condition.
		String search = party == null ? "" : party.trim();

		if (search.isEmpty()) {
			return transactionRepository.findByFiltersWithoutParty(type, from, to, createdBy, pageable);
		}

		return transactionRepository.findByFiltersWithParty(type, from, to, search, createdBy, pageable);
	}

	public Transaction findById(Long id) {
		Transaction tx = transactionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Transaction", id));
		if (!currentUser.isAdmin() && !tx.getCreatedBy().equals(currentUser.getUserId())) {
			throw new ResourceNotFoundException("Transaction");
		}
		return tx;
	}

	public BigDecimal totalSales(Long requestedUserId) {
		return transactionRepository.sumByType(TransactionType.SALE, currentUser.resolveDataFilter(requestedUserId));
	}

	public BigDecimal totalPurchases(Long requestedUserId) {
		return transactionRepository.sumByType(TransactionType.PURCHASE,
				currentUser.resolveDataFilter(requestedUserId));
	}

	public List<Object[]> getMonthlyProfitLoss(Integer year, Long requestedUserId) {
		return transactionRepository.getMonthlyProfitLoss(year, currentUser.resolveDataFilter(requestedUserId));
	}

	public List<Transaction> getRecent(Long requestedUserId) {
		Long createdBy = currentUser.resolveDataFilter(requestedUserId);
		return createdBy == null ? transactionRepository.findTop5ByOrderByCreatedAtDesc()
				: transactionRepository.findTop5ByCreatedByOrderByCreatedAtDesc(createdBy);
	}
}
