#!/usr/bin/env python3
import json, sys
data = {f"field{i}": f"value{i}" for i in range(1,71)}
print(json.dumps(data))
