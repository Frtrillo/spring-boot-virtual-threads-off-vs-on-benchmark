package com.example.iotbench;

public class Product {
    private final Long id;
    private final String name;
    private final double price;
    private final String category;
    private final double taxRate;
    private final double weight;

    public Product(Long id, String name, double price, String category, 
                  double taxRate, double weight) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
        this.taxRate = taxRate;
        this.weight = weight;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public String getCategory() { return category; }
    public double getTaxRate() { return taxRate; }
    public double getWeight() { return weight; }
}
