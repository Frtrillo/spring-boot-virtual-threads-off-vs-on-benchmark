package com.example.iotbench;

public class OrderCalculation {
    private final double totalAmount;
    private final double discountAmount;
    private final double taxAmount;
    private final double finalAmount;

    public OrderCalculation(double totalAmount, double discountAmount, 
                           double taxAmount, double finalAmount) {
        this.totalAmount = totalAmount;
        this.discountAmount = discountAmount;
        this.taxAmount = taxAmount;
        this.finalAmount = finalAmount;
    }

    public double getTotalAmount() { return totalAmount; }
    public double getDiscountAmount() { return discountAmount; }
    public double getTaxAmount() { return taxAmount; }
    public double getFinalAmount() { return finalAmount; }
}
