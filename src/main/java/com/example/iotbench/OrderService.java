package com.example.iotbench;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class OrderService {

    private final JdbcTemplate jdbcTemplate;
    private final PricingEngine pricingEngine;

    public OrderService(JdbcTemplate jdbcTemplate, PricingEngine pricingEngine) {
        this.jdbcTemplate = jdbcTemplate;
        this.pricingEngine = pricingEngine;
        initializeTables();
        seedData();
    }

    private void initializeTables() {
        // Create realistic enterprise tables
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id BIGINT PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                tier VARCHAR(50),
                discount_rate DECIMAL(5,2),
                credit_limit DECIMAL(12,2),
                region VARCHAR(100)
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id BIGINT PRIMARY KEY,
                name VARCHAR(255),
                price DECIMAL(10,2),
                category VARCHAR(100),
                tax_rate DECIMAL(5,2),
                weight DECIMAL(8,2)
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id BIGINT PRIMARY KEY,
                customer_id BIGINT,
                total_amount DECIMAL(12,2),
                discount_amount DECIMAL(12,2),
                tax_amount DECIMAL(12,2),
                final_amount DECIMAL(12,2),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);
    }

    private void seedData() {
        // Check if data already exists
        Integer customerCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM customers", Integer.class);
        if (customerCount > 0) return;

        // Seed customers (realistic enterprise data)
        String[] tiers = {"BRONZE", "SILVER", "GOLD", "PLATINUM"};
        String[] regions = {"US_EAST", "US_WEST", "EU", "ASIA"};
        
        for (int i = 1; i <= 1000; i++) {
            String tier = tiers[i % tiers.length];
            String region = regions[i % regions.length];
            double discountRate = switch (tier) {
                case "BRONZE" -> 0.05;
                case "SILVER" -> 0.10;
                case "GOLD" -> 0.15;
                case "PLATINUM" -> 0.20;
                default -> 0.0;
            };
            
            jdbcTemplate.update("""
                INSERT INTO customers (id, name, email, tier, discount_rate, credit_limit, region)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, i, "Customer " + i, "customer" + i + "@example.com", tier, discountRate, 10000.0, region);
        }

        // Seed products
        String[] categories = {"ELECTRONICS", "BOOKS", "CLOTHING", "HOME", "SPORTS"};
        for (int i = 1; i <= 100; i++) {
            String category = categories[i % categories.length];
            double price = 10.0 + (i * 5.0); // Prices from $10 to $500
            double taxRate = switch (category) {
                case "ELECTRONICS" -> 0.08;
                case "BOOKS" -> 0.0;
                case "CLOTHING" -> 0.06;
                case "HOME" -> 0.07;
                case "SPORTS" -> 0.05;
                default -> 0.05;
            };
            
            jdbcTemplate.update("""
                INSERT INTO products (id, name, price, category, tax_rate, weight)
                VALUES (?, ?, ?, ?, ?, ?)
            """, i, "Product " + i, price, category, taxRate, 1.0 + (i * 0.1));
        }
    }

    public OrderResult processOrder(Map<String, Object> orderRequest) {
        // 1. Input validation (CPU-intensive business logic)
        validateOrderRequest(orderRequest);
        
        // 2. Extract order details
        Long customerId = extractCustomerId(orderRequest);
        List<OrderItem> items = extractOrderItems(orderRequest);
        
        // 3. Single customer lookup (minimal I/O)
        Customer customer = loadCustomer(customerId);
        
        // 4. Load products for pricing (single query with IN clause)
        Map<Long, Product> products = loadProducts(items);
        
        // 5. CPU-intensive business logic (where Java should excel)
        OrderCalculation calculation = pricingEngine.calculateOrder(customer, items, products);
        
        // 6. Validate business rules (CPU work)
        validateBusinessRules(customer, calculation);
        
        // 7. Single database write
        Long orderId = saveOrder(customerId, calculation);
        
        return new OrderResult(orderId, customerId, calculation);
    }

    private void validateOrderRequest(Map<String, Object> request) {
        if (request == null) {
            throw new IllegalArgumentException("Order request cannot be null");
        }
        
        if (!request.containsKey("customerId")) {
            throw new IllegalArgumentException("Customer ID is required");
        }
        
        if (!request.containsKey("items")) {
            throw new IllegalArgumentException("Order items are required");
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");
        if (items.isEmpty()) {
            throw new IllegalArgumentException("At least one item is required");
        }
        
        // Validate each item (CPU work)
        for (Map<String, Object> item : items) {
            if (!item.containsKey("productId") || !item.containsKey("quantity")) {
                throw new IllegalArgumentException("Each item must have productId and quantity");
            }
            
            Integer quantity = (Integer) item.get("quantity");
            if (quantity <= 0 || quantity > 100) {
                throw new IllegalArgumentException("Quantity must be between 1 and 100");
            }
        }
    }

    private Long extractCustomerId(Map<String, Object> request) {
        Object customerIdObj = request.get("customerId");
        if (customerIdObj instanceof Integer) {
            return ((Integer) customerIdObj).longValue();
        } else if (customerIdObj instanceof Long) {
            return (Long) customerIdObj;
        } else {
            throw new IllegalArgumentException("Invalid customer ID format");
        }
    }

    @SuppressWarnings("unchecked")
    private List<OrderItem> extractOrderItems(Map<String, Object> request) {
        List<Map<String, Object>> itemMaps = (List<Map<String, Object>>) request.get("items");
        List<OrderItem> items = new ArrayList<>();
        
        for (Map<String, Object> itemMap : itemMaps) {
            Long productId = ((Integer) itemMap.get("productId")).longValue();
            Integer quantity = (Integer) itemMap.get("quantity");
            items.add(new OrderItem(productId, quantity));
        }
        
        return items;
    }

    private Customer loadCustomer(Long customerId) {
        return jdbcTemplate.queryForObject("""
            SELECT id, name, email, tier, discount_rate, credit_limit, region
            FROM customers WHERE id = ?
        """, (rs, rowNum) -> new Customer(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("email"),
            rs.getString("tier"),
            rs.getDouble("discount_rate"),
            rs.getDouble("credit_limit"),
            rs.getString("region")
        ), customerId);
    }

    private Map<Long, Product> loadProducts(List<OrderItem> items) {
        List<Long> productIds = items.stream().map(OrderItem::getProductId).toList();
        String inClause = String.join(",", Collections.nCopies(productIds.size(), "?"));
        
        List<Product> products = jdbcTemplate.query(
            "SELECT id, name, price, category, tax_rate, weight FROM products WHERE id IN (" + inClause + ")",
            productIds.toArray(),
            (rs, rowNum) -> new Product(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getDouble("price"),
                rs.getString("category"),
                rs.getDouble("tax_rate"),
                rs.getDouble("weight")
            )
        );
        
        return products.stream().collect(HashMap::new, (map, product) -> map.put(product.getId(), product), HashMap::putAll);
    }

    private void validateBusinessRules(Customer customer, OrderCalculation calculation) {
        // Credit limit check (CPU work)
        if (calculation.getFinalAmount() > customer.getCreditLimit()) {
            throw new RuntimeException("Order exceeds customer credit limit");
        }
        
        // Regional restrictions (CPU work)
        if ("EU".equals(customer.getRegion()) && calculation.getTotalAmount() > 1000.0) {
            throw new RuntimeException("EU orders over €1000 require additional verification");
        }
    }

    private Long saveOrder(Long customerId, OrderCalculation calculation) {
        Long orderId = System.currentTimeMillis() + (long) (Math.random() * 1000);
        
        jdbcTemplate.update("""
            INSERT INTO orders (id, customer_id, total_amount, discount_amount, tax_amount, final_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, orderId, customerId, calculation.getTotalAmount(), calculation.getDiscountAmount(),
            calculation.getTaxAmount(), calculation.getFinalAmount(), "CONFIRMED");
        
        return orderId;
    }
}
