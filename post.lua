wrk.method = "POST"
wrk.body   = io.open("payload.json"):read("*all")
wrk.headers["Content-Type"] = "application/json"
