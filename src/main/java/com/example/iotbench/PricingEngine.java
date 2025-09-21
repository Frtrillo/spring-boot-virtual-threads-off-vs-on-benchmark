package com.example.iotbench;

import org.springframework.stereotype.Component;
import java.util.*;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PricingEngine {

    /**
     * Complex CPU-intensive pricing calculation - where Java should excel
     * This simulates real enterprise pricing logic with multiple business rules
     */
    public OrderCalculation calculateOrder(Customer customer, List<OrderItem> items, Map<Long, Product> products) {
        double totalAmount = 0.0;
        double totalWeight = 0.0;
        Map<String, Integer> categoryQuantities = new HashMap<>();
        
        // 1. Calculate base amounts (CPU work)
        for (OrderItem item : items) {
            Product product = products.get(item.getProductId());
            if (product == null) {
                throw new RuntimeException("Product not found: " + item.getProductId());
            }
            
            double itemTotal = product.getPrice() * item.getQuantity();
            totalAmount += itemTotal;
            totalWeight += product.getWeight() * item.getQuantity();
            
            // Track category quantities for volume discounts
            categoryQuantities.merge(product.getCategory(), item.getQuantity(), Integer::sum);
        }
        
        // 2. Apply customer tier discount (business logic)
        double discountAmount = totalAmount * customer.getDiscountRate();
        
        // 3. Apply volume discounts (complex business rules)
        double volumeDiscount = calculateVolumeDiscount(categoryQuantities, totalAmount);
        discountAmount += volumeDiscount;
        
        // 4. Apply seasonal promotions (CPU-intensive date calculations)
        double seasonalDiscount = calculateSeasonalDiscount(totalAmount, customer.getRegion());
        discountAmount += seasonalDiscount;
        
        // 5. Calculate shipping costs (complex algorithm)
        double shippingCost = calculateShippingCost(totalWeight, customer.getRegion(), totalAmount);
        
        // 6. Calculate taxes (business rules per product category)
        double taxAmount = calculateTaxes(items, products, customer.getRegion());
        
        // 7. Apply loyalty bonuses (complex customer history simulation)
        double loyaltyBonus = calculateLoyaltyBonus(customer, totalAmount);
        discountAmount += loyaltyBonus;
        
        // 8. Final amount calculation with rounding
        double subtotal = totalAmount - discountAmount + shippingCost;
        double finalAmount = subtotal + taxAmount;
        
        // Round to 2 decimal places (financial precision)
        totalAmount = round(totalAmount, 2);
        discountAmount = round(discountAmount, 2);
        taxAmount = round(taxAmount, 2);
        finalAmount = round(finalAmount, 2);
        
        return new OrderCalculation(totalAmount, discountAmount, taxAmount, finalAmount);
    }

    /**
     * Volume discount calculation - complex business rules
     */
    private double calculateVolumeDiscount(Map<String, Integer> categoryQuantities, double totalAmount) {
        double volumeDiscount = 0.0;
        
        for (Map.Entry<String, Integer> entry : categoryQuantities.entrySet()) {
            String category = entry.getKey();
            Integer quantity = entry.getValue();
            
            // Category-specific volume discounts
            double categoryDiscount = switch (category) {
                case "ELECTRONICS" -> {
                    if (quantity >= 10) yield totalAmount * 0.05; // 5% for 10+ electronics
                    if (quantity >= 5) yield totalAmount * 0.02;  // 2% for 5+ electronics
                    yield 0.0;
                }
                case "BOOKS" -> {
                    if (quantity >= 20) yield totalAmount * 0.10; // 10% for 20+ books
                    if (quantity >= 10) yield totalAmount * 0.05; // 5% for 10+ books
                    yield 0.0;
                }
                case "CLOTHING" -> {
                    if (quantity >= 15) yield totalAmount * 0.08; // 8% for 15+ clothing items
                    yield 0.0;
                }
                default -> 0.0;
            };
            
            volumeDiscount += categoryDiscount;
        }
        
        return volumeDiscount;
    }

    /**
     * Seasonal discount calculation - CPU-intensive date/region logic
     */
    private double calculateSeasonalDiscount(double totalAmount, String region) {
        Calendar cal = Calendar.getInstance();
        int month = cal.get(Calendar.MONTH) + 1; // 1-12
        int dayOfYear = cal.get(Calendar.DAY_OF_YEAR);
        
        // Complex seasonal calculations (CPU work)
        double seasonalRate = 0.0;
        
        // Holiday seasons (Black Friday, Christmas, etc.)
        if (month == 11 || month == 12) {
            seasonalRate += 0.15; // 15% holiday discount
        }
        
        // Summer sales (region-dependent)
        if (month >= 6 && month <= 8) {
            seasonalRate += switch (region) {
                case "US_EAST", "US_WEST" -> 0.10;
                case "EU" -> 0.08;
                case "ASIA" -> 0.12;
                default -> 0.05;
            };
        }
        
        // Flash sales (pseudo-random based on day of year)
        if (dayOfYear % 30 == 0) { // Every 30th day
            seasonalRate += 0.05; // Flash sale
        }
        
        return totalAmount * Math.min(seasonalRate, 0.25); // Max 25% seasonal discount
    }

    /**
     * Shipping cost calculation - complex algorithm with multiple factors
     */
    private double calculateShippingCost(double weight, String region, double orderValue) {
        // Base shipping rates by region
        double baseRate = switch (region) {
            case "US_EAST" -> 5.99;
            case "US_WEST" -> 7.99;
            case "EU" -> 9.99;
            case "ASIA" -> 12.99;
            default -> 8.99;
        };
        
        // Weight-based calculation
        double weightCost = weight * 0.5; // $0.50 per pound
        
        // Distance simulation (CPU-intensive calculation)
        double distanceMultiplier = 1.0 + (Math.sin(region.hashCode()) * 0.2);
        
        double shippingCost = (baseRate + weightCost) * distanceMultiplier;
        
        // Free shipping threshold
        if (orderValue > 100.0) {
            shippingCost *= 0.5; // 50% discount on shipping
        }
        
        if (orderValue > 500.0) {
            shippingCost = 0.0; // Free shipping
        }
        
        return Math.max(shippingCost, 0.0);
    }

    /**
     * Tax calculation - complex business rules per region and product
     */
    private double calculateTaxes(List<OrderItem> items, Map<Long, Product> products, String region) {
        double totalTax = 0.0;
        
        // Regional tax multipliers
        double regionalMultiplier = switch (region) {
            case "US_EAST" -> 1.0;
            case "US_WEST" -> 0.9;
            case "EU" -> 1.2; // Higher VAT
            case "ASIA" -> 0.8;
            default -> 1.0;
        };
        
        for (OrderItem item : items) {
            Product product = products.get(item.getProductId());
            double itemValue = product.getPrice() * item.getQuantity();
            double itemTax = itemValue * product.getTaxRate() * regionalMultiplier;
            totalTax += itemTax;
        }
        
        return totalTax;
    }

    /**
     * Loyalty bonus calculation - simulates complex customer history analysis
     */
    private double calculateLoyaltyBonus(Customer customer, double totalAmount) {
        // Simulate customer history analysis (CPU work)
        long customerId = customer.getId();
        
        // Pseudo-random loyalty score based on customer ID (simulates history lookup)
        int loyaltyScore = (int) ((customerId * 31 + 17) % 100); // 0-99
        
        // Tier-based loyalty multipliers
        double tierMultiplier = switch (customer.getTier()) {
            case "BRONZE" -> 1.0;
            case "SILVER" -> 1.5;
            case "GOLD" -> 2.0;
            case "PLATINUM" -> 3.0;
            default -> 1.0;
        };
        
        // Complex loyalty calculation
        double loyaltyRate = (loyaltyScore / 1000.0) * tierMultiplier; // Max 0.3% for Platinum
        
        return totalAmount * loyaltyRate;
    }

    /**
     * Precise financial rounding
     */
    private double round(double value, int places) {
        return BigDecimal.valueOf(value)
            .setScale(places, RoundingMode.HALF_UP)
            .doubleValue();
    }
}
