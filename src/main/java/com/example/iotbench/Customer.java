package com.example.iotbench;

public class Customer {
    private final Long id;
    private final String name;
    private final String email;
    private final String tier;
    private final double discountRate;
    private final double creditLimit;
    private final String region;

    public Customer(Long id, String name, String email, String tier, 
                   double discountRate, double creditLimit, String region) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.tier = tier;
        this.discountRate = discountRate;
        this.creditLimit = creditLimit;
        this.region = region;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getTier() { return tier; }
    public double getDiscountRate() { return discountRate; }
    public double getCreditLimit() { return creditLimit; }
    public String getRegion() { return region; }
}
