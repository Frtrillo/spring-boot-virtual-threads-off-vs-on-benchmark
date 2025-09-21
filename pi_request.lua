-- Lua script for π calculation benchmark with different iteration counts

wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

-- Different iteration counts to test
local iterationCounts = {1000000, 5000000, 10000000, 50000000}
local counter = 0

function request()
    counter = counter + 1
    local iterations = iterationCounts[(counter % 4) + 1]
    
    local body = string.format('{"iterations": %d}', iterations)
    
    return wrk.format("POST", "/api/pi/calculate", wrk.headers, body)
end
