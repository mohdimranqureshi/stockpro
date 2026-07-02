package com.dealerpro.service.impl;

import com.dealerpro.entity.enums.ScrapStatus;
import com.dealerpro.entity.enums.StockStatus;
import com.dealerpro.repository.ReplacementRepository;
import com.dealerpro.repository.ScrapRepository;
import com.dealerpro.repository.StockRepository;
import com.dealerpro.security.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final StockRepository stockRepository;
    private final TransactionService transactionService;
    private final PaymentService paymentService;
    private final ReplacementRepository replacementRepository;
    private final ScrapRepository scrapRepository;
    private final ScrapService scrapService;
    private final StockService stockService;
    private final CurrentUserService currentUser;

    /**
     * @param requestedUserId optional — admin-only filter to view a specific
     *                         user's dashboard. Ignored for non-admins (who
     *                         always see only their own data).
     */
    public Map<String, Object> getSummary(Long requestedUserId) {
        Long createdBy = currentUser.resolveDataFilter(requestedUserId);

        long totalStock     = stockService.countByStatus(null, requestedUserId);
        long availableStock = stockService.countByStatus(StockStatus.AVAILABLE, requestedUserId);
        long soldStock       = stockService.countByStatus(StockStatus.SOLD, requestedUserId);
        long inRepair        = stockService.countByStatus(StockStatus.IN_REPAIR, requestedUserId);

        BigDecimal totalSales     = transactionService.totalSales(requestedUserId);
        BigDecimal totalPurchases = transactionService.totalPurchases(requestedUserId);
        BigDecimal netPL          = totalSales.subtract(totalPurchases);
        BigDecimal totalInflow    = paymentService.totalInflow(requestedUserId);
        BigDecimal totalOutflow   = paymentService.totalOutflow(requestedUserId);

        long totalReplacements = createdBy == null
                ? replacementRepository.count()
                : replacementRepository.countByCreatedBy(createdBy);
        long scrapTagged       = scrapService.countByStatus(ScrapStatus.TAGGED_FOR_SALE, requestedUserId);

        var recentTx = transactionService.getRecent(requestedUserId);

        int year = java.time.LocalDate.now().getYear();
        var monthlyPL = transactionService.getMonthlyProfitLoss(year, requestedUserId);

        List<Map<String, Object>> plRows = new ArrayList<>();
        for (Object[] row : monthlyPL) {
            plRows.add(Map.of(
                    "month", row[0],
                    "sales", row[1] != null ? row[1] : BigDecimal.ZERO,
                    "purchases", row[2] != null ? row[2] : BigDecimal.ZERO,
                    "profitLoss", (row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO)
                            .subtract(row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO)
            ));
        }

        List<Map<String, Object>> txList = new ArrayList<>();
        for (var tx : recentTx) {
            txList.add(Map.of(
                    "id", tx.getId(),
                    "type", tx.getType(),
                    "itemName", tx.getItemName(),
                    "partyName", tx.getPartyName(),
                    "finalAmount", tx.getFinalAmount(),
                    "transactionDate", tx.getTransactionDate()
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalStock", totalStock);
        result.put("availableStock", availableStock);
        result.put("soldStock", soldStock);
        result.put("inRepair", inRepair);
        result.put("totalSalesRevenue", totalSales);
        result.put("totalPurchaseCost", totalPurchases);
        result.put("netProfitLoss", netPL);
        result.put("totalInflow", totalInflow);
        result.put("totalOutflow", totalOutflow);
        result.put("totalReplacements", totalReplacements);
        result.put("scrapTagged", scrapTagged);
        result.put("recentTransactions", txList);
        result.put("monthlyProfitLoss", plRows);
        result.put("isFilteredView", createdBy != null);
        result.put("viewingAllUsers", currentUser.isAdmin() && requestedUserId == null);
        return result;
    }
}
