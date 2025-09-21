import { Database } from "bun:sqlite";
import { serve } from "bun";

// In-memory SQLite database (same as Java H2)
const db = new Database(":memory:");

// Initialize database with same schema as Java
db.exec(`
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        tier TEXT,
        discount_rate REAL,
        credit_limit REAL,
        region TEXT
    );
    
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        price REAL,
        category TEXT,
        tax_rate REAL,
        weight REAL
    );
    
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        total_amount REAL,
        discount_amount REAL,
        tax_amount REAL,
        final_amount REAL,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Prepared statements for better performance
const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, tier, discount_rate, credit_limit, region)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertProduct = db.prepare(`
    INSERT INTO products (id, name, price, category, tax_rate, weight)
    VALUES (?, ?, ?, ?, ?, ?)
`);

const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, total_amount, discount_amount, tax_amount, final_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const selectCustomer = db.prepare(`
    SELECT id, name, email, tier, discount_rate, credit_limit, region
    FROM customers WHERE id = ?
`);

// Seed data (same as Java)
function seedData() {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const regions = ['US_EAST', 'US_WEST', 'EU', 'ASIA'];
    
    for (let i = 1; i <= 1000; i++) {
        const tier = tiers[i % tiers.length];
        const region = regions[i % regions.length];
        const discountRate = {
            'BRONZE': 0.05,
            'SILVER': 0.10,
            'GOLD': 0.15,
            'PLATINUM': 0.20
        }[tier];
        
        insertCustomer.run(i, `Customer ${i}`, `customer${i}@example.com`, tier, discountRate, 10000.0, region);
    }
    
    const categories = ['ELECTRONICS', 'BOOKS', 'CLOTHING', 'HOME', 'SPORTS'];
    for (let i = 1; i <= 100; i++) {
        const category = categories[i % categories.length];
        const price = 10.0 + (i * 5.0);
        const taxRate = {
            'ELECTRONICS': 0.08,
            'BOOKS': 0.0,
            'CLOTHING': 0.06,
            'HOME': 0.07,
            'SPORTS': 0.05
        }[category] || 0.05;
        
        insertProduct.run(i, `Product ${i}`, price, category, taxRate, 1.0 + (i * 0.1));
    }
}

seedData();

const server = serve({
    port: 8080,
    async fetch(req) {
        const url = new URL(req.url);
        
        if (req.method === "POST" && url.pathname === "/api/process-order") {
            const start = Bun.nanoseconds();
            
            try {
                const orderRequest = await req.json();
                
                // 1. Input validation (CPU-intensive business logic)
                validateOrderRequest(orderRequest);
                
                // 2. Extract order details
                const customerId = extractCustomerId(orderRequest);
                const items = extractOrderItems(orderRequest);
                
                // 3. Single customer lookup (minimal I/O)
                const customer = loadCustomer(customerId);
                
                // 4. Load products for pricing (single query)
                const products = loadProducts(items);
                
                // 5. CPU-intensive business logic
                const calculation = calculateOrder(customer, items, products);
                
                // 6. Validate business rules (CPU work)
                validateBusinessRules(customer, calculation);
                
                // 7. Single database write
                const orderId = saveOrder(customerId, calculation);
                
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                const response = {
                    orderId: orderId,
                    customerId: customerId,
                    totalAmount: calculation.totalAmount,
                    discountApplied: calculation.discountAmount,
                    taxAmount: calculation.taxAmount,
                    finalAmount: calculation.finalAmount,
                    processingTimeMs: Math.round(elapsedMs * 100) / 100,
                    status: "SUCCESS",
                    thread: `Bun ${Bun.version} Single Thread`
                };
                
                return new Response(JSON.stringify(response), {
                    headers: { "Content-Type": "application/json" }
                });
                
            } catch (error) {
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                return new Response(JSON.stringify({
                    error: "Order processing failed",
                    message: error.message,
                    processingTimeMs: Math.round(elapsedMs * 100) / 100,
                    status: "ERROR"
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
        
        if (req.method === "GET" && url.pathname === "/api/health") {
            const memUsage = process.memoryUsage();
            
            return new Response(JSON.stringify({
                status: "ok",
                timestamp: new Date(),
                runtime: "Bun Realistic Enterprise",
                virtualThreads: false,
                availableProcessors: navigator.hardwareConcurrency || 4,
                totalMemory: memUsage.heapTotal,
                freeMemory: memUsage.heapTotal - memUsage.heapUsed
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response("Not Found", { status: 404 });
    }
});

function validateOrderRequest(request: any) {
    if (!request) {
        throw new Error("Order request cannot be null");
    }
    
    if (!request.customerId) {
        throw new Error("Customer ID is required");
    }
    
    if (!request.items || !Array.isArray(request.items)) {
        throw new Error("Order items are required");
    }
    
    if (request.items.length === 0) {
        throw new Error("At least one item is required");
    }
    
    for (const item of request.items) {
        if (!item.productId || !item.quantity) {
            throw new Error("Each item must have productId and quantity");
        }
        
        if (item.quantity <= 0 || item.quantity > 100) {
            throw new Error("Quantity must be between 1 and 100");
        }
    }
}

function extractCustomerId(request: any): number {
    return parseInt(request.customerId);
}

function extractOrderItems(request: any): Array<{productId: number, quantity: number}> {
    return request.items.map((item: any) => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity)
    }));
}

function loadCustomer(customerId: number): any {
    const row = selectCustomer.get(customerId) as any;
    if (!row) {
        throw new Error("Customer not found");
    }
    
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        tier: row.tier,
        discountRate: row.discount_rate,
        creditLimit: row.credit_limit,
        region: row.region
    };
}

function loadProducts(items: Array<{productId: number, quantity: number}>): any {
    const productIds = items.map(item => item.productId);
    const placeholders = productIds.map(() => '?').join(',');
    
    const rows = db.prepare(`
        SELECT id, name, price, category, tax_rate, weight 
        FROM products WHERE id IN (${placeholders})
    `).all(...productIds) as any[];
    
    const products: any = {};
    rows.forEach(row => {
        products[row.id] = {
            id: row.id,
            name: row.name,
            price: row.price,
            category: row.category,
            taxRate: row.tax_rate,
            weight: row.weight
        };
    });
    
    return products;
}

// Same complex calculation logic as Java and Node.js
function calculateOrder(customer: any, items: any[], products: any): any {
    let totalAmount = 0.0;
    let totalWeight = 0.0;
    const categoryQuantities: any = {};
    
    // Calculate base amounts
    for (const item of items) {
        const product = products[item.productId];
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        totalWeight += product.weight * item.quantity;
        
        categoryQuantities[product.category] = (categoryQuantities[product.category] || 0) + item.quantity;
    }
    
    let discountAmount = totalAmount * customer.discountRate;
    
    // Apply volume discounts
    const volumeDiscount = calculateVolumeDiscount(categoryQuantities, totalAmount);
    discountAmount += volumeDiscount;
    
    // Apply seasonal promotions
    const seasonalDiscount = calculateSeasonalDiscount(totalAmount, customer.region);
    discountAmount += seasonalDiscount;
    
    // Calculate shipping costs
    const shippingCost = calculateShippingCost(totalWeight, customer.region, totalAmount);
    
    // Calculate taxes
    const taxAmount = calculateTaxes(items, products, customer.region);
    
    // Apply loyalty bonuses
    const loyaltyBonus = calculateLoyaltyBonus(customer, totalAmount);
    discountAmount += loyaltyBonus;
    
    // Final calculation
    const subtotal = totalAmount - discountAmount + shippingCost;
    const finalAmount = subtotal + taxAmount;
    
    return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100
    };
}

// Same business logic functions as Node.js (identical implementation)
function calculateVolumeDiscount(categoryQuantities: any, totalAmount: number): number {
    let volumeDiscount = 0.0;
    
    for (const [category, quantity] of Object.entries(categoryQuantities)) {
        let categoryDiscount = 0.0;
        
        switch (category) {
            case 'ELECTRONICS':
                if (quantity >= 10) categoryDiscount = totalAmount * 0.05;
                else if (quantity >= 5) categoryDiscount = totalAmount * 0.02;
                break;
            case 'BOOKS':
                if (quantity >= 20) categoryDiscount = totalAmount * 0.10;
                else if (quantity >= 10) categoryDiscount = totalAmount * 0.05;
                break;
            case 'CLOTHING':
                if (quantity >= 15) categoryDiscount = totalAmount * 0.08;
                break;
        }
        
        volumeDiscount += categoryDiscount;
    }
    
    return volumeDiscount;
}

function calculateSeasonalDiscount(totalAmount: number, region: string): number {
    const now = new Date();
    const month = now.getMonth() + 1;
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    let seasonalRate = 0.0;
    
    if (month === 11 || month === 12) {
        seasonalRate += 0.15;
    }
    
    if (month >= 6 && month <= 8) {
        switch (region) {
            case 'US_EAST':
            case 'US_WEST':
                seasonalRate += 0.10;
                break;
            case 'EU':
                seasonalRate += 0.08;
                break;
            case 'ASIA':
                seasonalRate += 0.12;
                break;
            default:
                seasonalRate += 0.05;
        }
    }
    
    if (dayOfYear % 30 === 0) {
        seasonalRate += 0.05;
    }
    
    return totalAmount * Math.min(seasonalRate, 0.25);
}

function calculateShippingCost(weight: number, region: string, orderValue: number): number {
    const baseRates: any = {
        'US_EAST': 5.99,
        'US_WEST': 7.99,
        'EU': 9.99,
        'ASIA': 12.99
    };
    
    const baseRate = baseRates[region] || 8.99;
    const weightCost = weight * 0.5;
    const distanceMultiplier = 1.0 + (Math.sin(region.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) * 0.2);
    
    let shippingCost = (baseRate + weightCost) * distanceMultiplier;
    
    if (orderValue > 100.0) {
        shippingCost *= 0.5;
    }
    
    if (orderValue > 500.0) {
        shippingCost = 0.0;
    }
    
    return Math.max(shippingCost, 0.0);
}

function calculateTaxes(items: any[], products: any, region: string): number {
    const regionalMultipliers: any = {
        'US_EAST': 1.0,
        'US_WEST': 0.9,
        'EU': 1.2,
        'ASIA': 0.8
    };
    
    const regionalMultiplier = regionalMultipliers[region] || 1.0;
    let totalTax = 0.0;
    
    for (const item of items) {
        const product = products[item.productId];
        const itemValue = product.price * item.quantity;
        const itemTax = itemValue * product.taxRate * regionalMultiplier;
        totalTax += itemTax;
    }
    
    return totalTax;
}

function calculateLoyaltyBonus(customer: any, totalAmount: number): number {
    const loyaltyScore = (customer.id * 31 + 17) % 100;
    
    const tierMultipliers: any = {
        'BRONZE': 1.0,
        'SILVER': 1.5,
        'GOLD': 2.0,
        'PLATINUM': 3.0
    };
    
    const tierMultiplier = tierMultipliers[customer.tier] || 1.0;
    const loyaltyRate = (loyaltyScore / 1000.0) * tierMultiplier;
    
    return totalAmount * loyaltyRate;
}

function validateBusinessRules(customer: any, calculation: any) {
    if (calculation.finalAmount > customer.creditLimit) {
        throw new Error("Order exceeds customer credit limit");
    }
    
    if (customer.region === 'EU' && calculation.totalAmount > 1000.0) {
        throw new Error("EU orders over €1000 require additional verification");
    }
}

function saveOrder(customerId: number, calculation: any): number {
    const orderId = Date.now() + Math.floor(Math.random() * 1000);
    
    insertOrder.run(orderId, customerId, calculation.totalAmount, calculation.discountAmount,
                   calculation.taxAmount, calculation.finalAmount, 'CONFIRMED');
    
    return orderId;
}

console.log('🚀 Realistic Bun Enterprise server listening on port 8080');
console.log('📊 This tests REAL enterprise patterns with business logic');
