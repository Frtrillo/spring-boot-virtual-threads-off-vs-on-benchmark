const fastify = require('fastify')({ logger: false });
const sqlite3 = require('sqlite3').verbose();

// In-memory SQLite database (same as Java H2)
const db = new sqlite3.Database(':memory:');

// Initialize database with same schema as Java
db.serialize(() => {
    db.run(`
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            tier TEXT,
            discount_rate REAL,
            credit_limit REAL,
            region TEXT
        )
    `);
    
    db.run(`
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT,
            price REAL,
            category TEXT,
            tax_rate REAL,
            weight REAL
        )
    `);
    
    db.run(`
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            total_amount REAL,
            discount_amount REAL,
            tax_amount REAL,
            final_amount REAL,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    seedData();
});

function seedData() {
    // Seed customers (same data as Java)
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
        
        db.run(`
            INSERT INTO customers (id, name, email, tier, discount_rate, credit_limit, region)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [i, `Customer ${i}`, `customer${i}@example.com`, tier, discountRate, 10000.0, region]);
    }
    
    // Seed products (same data as Java)
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
        
        db.run(`
            INSERT INTO products (id, name, price, category, tax_rate, weight)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [i, `Product ${i}`, price, category, taxRate, 1.0 + (i * 0.1)]);
    }
}

// Realistic enterprise order processing endpoint
fastify.post('/api/process-order', async (request, reply) => {
    const start = process.hrtime.bigint();
    
    try {
        const orderRequest = request.body;
        
        // 1. Input validation (CPU-intensive business logic)
        validateOrderRequest(orderRequest);
        
        // 2. Extract order details
        const customerId = extractCustomerId(orderRequest);
        const items = extractOrderItems(orderRequest);
        
        // 3. Single customer lookup (minimal I/O)
        const customer = await loadCustomer(customerId);
        
        // 4. Load products for pricing (single query with IN clause)
        const products = await loadProducts(items);
        
        // 5. CPU-intensive business logic (where Java should excel, but let's see)
        const calculation = calculateOrder(customer, items, products);
        
        // 6. Validate business rules (CPU work)
        validateBusinessRules(customer, calculation);
        
        // 7. Single database write
        const orderId = await saveOrder(customerId, calculation);
        
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        const response = {
            orderId: orderId,
            customerId: customerId,
            totalAmount: calculation.totalAmount,
            discountApplied: calculation.discountAmount,
            taxAmount: calculation.taxAmount,
            finalAmount: calculation.finalAmount,
            processingTimeMs: Math.round(elapsedMs * 100) / 100,
            status: "SUCCESS",
            thread: "Node.js Single Thread"
        };
        
        return response;
        
    } catch (error) {
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        return reply.status(500).send({
            error: "Order processing failed",
            message: error.message,
            processingTimeMs: Math.round(elapsedMs * 100) / 100,
            status: "ERROR"
        });
    }
});

fastify.get('/api/health', async (request, reply) => {
    const memUsage = process.memoryUsage();
    
    return {
        status: "ok",
        timestamp: new Date(),
        runtime: "Node.js Realistic Enterprise",
        virtualThreads: false,
        availableProcessors: require('os').cpus().length,
        totalMemory: memUsage.heapTotal,
        freeMemory: memUsage.heapTotal - memUsage.heapUsed
    };
});

function validateOrderRequest(request) {
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
    
    // Validate each item (CPU work)
    for (const item of request.items) {
        if (!item.productId || !item.quantity) {
            throw new Error("Each item must have productId and quantity");
        }
        
        if (item.quantity <= 0 || item.quantity > 100) {
            throw new Error("Quantity must be between 1 and 100");
        }
    }
}

function extractCustomerId(request) {
    return parseInt(request.customerId);
}

function extractOrderItems(request) {
    return request.items.map(item => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity)
    }));
}

function loadCustomer(customerId) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT id, name, email, tier, discount_rate, credit_limit, region
            FROM customers WHERE id = ?
        `, [customerId], (err, row) => {
            if (err) reject(err);
            else if (!row) reject(new Error("Customer not found"));
            else resolve({
                id: row.id,
                name: row.name,
                email: row.email,
                tier: row.tier,
                discountRate: row.discount_rate,
                creditLimit: row.credit_limit,
                region: row.region
            });
        });
    });
}

function loadProducts(items) {
    return new Promise((resolve, reject) => {
        const productIds = items.map(item => item.productId);
        const placeholders = productIds.map(() => '?').join(',');
        
        db.all(`
            SELECT id, name, price, category, tax_rate, weight 
            FROM products WHERE id IN (${placeholders})
        `, productIds, (err, rows) => {
            if (err) reject(err);
            else {
                const products = {};
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
                resolve(products);
            }
        });
    });
}

/**
 * Complex CPU-intensive pricing calculation - same logic as Java
 */
function calculateOrder(customer, items, products) {
    let totalAmount = 0.0;
    let totalWeight = 0.0;
    const categoryQuantities = {};
    
    // 1. Calculate base amounts (CPU work)
    for (const item of items) {
        const product = products[item.productId];
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        totalWeight += product.weight * item.quantity;
        
        // Track category quantities for volume discounts
        categoryQuantities[product.category] = (categoryQuantities[product.category] || 0) + item.quantity;
    }
    
    // 2. Apply customer tier discount (business logic)
    let discountAmount = totalAmount * customer.discountRate;
    
    // 3. Apply volume discounts (complex business rules)
    const volumeDiscount = calculateVolumeDiscount(categoryQuantities, totalAmount);
    discountAmount += volumeDiscount;
    
    // 4. Apply seasonal promotions (CPU-intensive date calculations)
    const seasonalDiscount = calculateSeasonalDiscount(totalAmount, customer.region);
    discountAmount += seasonalDiscount;
    
    // 5. Calculate shipping costs (complex algorithm)
    const shippingCost = calculateShippingCost(totalWeight, customer.region, totalAmount);
    
    // 6. Calculate taxes (business rules per product category)
    const taxAmount = calculateTaxes(items, products, customer.region);
    
    // 7. Apply loyalty bonuses (complex customer history simulation)
    const loyaltyBonus = calculateLoyaltyBonus(customer, totalAmount);
    discountAmount += loyaltyBonus;
    
    // 8. Final amount calculation with rounding
    const subtotal = totalAmount - discountAmount + shippingCost;
    const finalAmount = subtotal + taxAmount;
    
    return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100
    };
}

function calculateVolumeDiscount(categoryQuantities, totalAmount) {
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

function calculateSeasonalDiscount(totalAmount, region) {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    let seasonalRate = 0.0;
    
    // Holiday seasons
    if (month === 11 || month === 12) {
        seasonalRate += 0.15;
    }
    
    // Summer sales (region-dependent)
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
    
    // Flash sales
    if (dayOfYear % 30 === 0) {
        seasonalRate += 0.05;
    }
    
    return totalAmount * Math.min(seasonalRate, 0.25);
}

function calculateShippingCost(weight, region, orderValue) {
    const baseRates = {
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

function calculateTaxes(items, products, region) {
    const regionalMultipliers = {
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

function calculateLoyaltyBonus(customer, totalAmount) {
    const loyaltyScore = (customer.id * 31 + 17) % 100;
    
    const tierMultipliers = {
        'BRONZE': 1.0,
        'SILVER': 1.5,
        'GOLD': 2.0,
        'PLATINUM': 3.0
    };
    
    const tierMultiplier = tierMultipliers[customer.tier] || 1.0;
    const loyaltyRate = (loyaltyScore / 1000.0) * tierMultiplier;
    
    return totalAmount * loyaltyRate;
}

function validateBusinessRules(customer, calculation) {
    // Credit limit check
    if (calculation.finalAmount > customer.creditLimit) {
        throw new Error("Order exceeds customer credit limit");
    }
    
    // Regional restrictions
    if (customer.region === 'EU' && calculation.totalAmount > 1000.0) {
        throw new Error("EU orders over €1000 require additional verification");
    }
}

function saveOrder(customerId, calculation) {
    return new Promise((resolve, reject) => {
        const orderId = Date.now() + Math.floor(Math.random() * 1000);
        
        db.run(`
            INSERT INTO orders (id, customer_id, total_amount, discount_amount, tax_amount, final_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [orderId, customerId, calculation.totalAmount, calculation.discountAmount,
            calculation.taxAmount, calculation.finalAmount, 'CONFIRMED'], (err) => {
            if (err) reject(err);
            else resolve(orderId);
        });
    });
}

const start = async () => {
    try {
        await fastify.listen({ port: 8080, host: '0.0.0.0' });
        console.log('🚀 Realistic Node.js Enterprise server listening on port 8080');
        console.log('📊 This tests REAL enterprise patterns with business logic');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
