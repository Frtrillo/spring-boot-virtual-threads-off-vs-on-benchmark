-- Lua script for CPU-intensive benchmark
-- This sends a larger payload to trigger more computation

wrk.method = "POST"
wrk.body   = '{"device_id":"cpu_test_device","type":"INDUSTRIAL_SENSOR","location":"FACTORY_FLOOR","temperature":25.5,"humidity":65.0,"pressure":1013.25,"vibration_x":0.1,"vibration_y":0.2,"vibration_z":0.05,"power_consumption":150.75,"operational_hours":8760,"maintenance_due":"2024-12-01","sensor_data":{"ph_level":7.2,"dissolved_oxygen":8.5,"turbidity":2.1,"conductivity":450.0,"flow_rate":12.5},"metadata":{"firmware_version":"v2.1.4","last_calibration":"2024-01-15","accuracy_rating":99.8,"certification":"ISO-9001"},"batch_data":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]}'
wrk.headers["Content-Type"] = "application/json"
