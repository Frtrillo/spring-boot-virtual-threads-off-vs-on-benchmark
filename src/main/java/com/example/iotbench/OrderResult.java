package com.example.iotbench;

public class OrderResult {
    private final Long orderId;
    private final Long customerId;
    private final OrderCalculation calculation;

    public OrderResult(Long orderId, Long customerId, OrderCalculation calculation) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.calculation = calculation;
    }

    public Long getOrderId() { return orderId; }
    public Long getCustomerId() { return customerId; }
    public double getTotalAmount() { return calculation.getTotalAmount(); }
    public double getDiscountApplied() { return calculation.getDiscountAmount(); }
    public double getTaxAmount() { return calculation.getTaxAmount(); }
    public double getFinalAmount() { return calculation.getFinalAmount(); }
}
