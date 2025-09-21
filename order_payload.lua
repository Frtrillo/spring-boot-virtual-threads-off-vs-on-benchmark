-- Lua script for realistic enterprise order processing benchmark

wrk.method = "POST"
wrk.body   = '{"customerId": 42, "items": [{"productId": 1, "quantity": 2}, {"productId": 15, "quantity": 1}, {"productId": 33, "quantity": 3}]}'
wrk.headers["Content-Type"] = "application/json"

-- Add some randomness to simulate different customers and orders
local counter = 0

function request()
    counter = counter + 1
    local customerId = (counter % 1000) + 1  -- Customers 1-1000
    local numItems = (counter % 3) + 1       -- 1-3 items per order
    
    local items = {}
    for i = 1, numItems do
        local productId = ((counter * i) % 100) + 1  -- Products 1-100
        local quantity = (counter % 5) + 1           -- Quantities 1-5
        table.insert(items, string.format('{"productId": %d, "quantity": %d}', productId, quantity))
    end
    
    local body = string.format('{"customerId": %d, "items": [%s]}', customerId, table.concat(items, ', '))
    
    return wrk.format("POST", "/api/process-order", wrk.headers, body)
end
