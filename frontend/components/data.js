export const data =`
import os
import pandas as pd
import json

print("--- Job Started ---")
print("Listing available data in /data:")
files = os.listdir("/data")
print(files)

# Analysis Logic (Example)
results = {
    "file_count": len(files),
    "status": "Processed"
}

# Save important metrics to outputs
with open("/outputs/metrics.json", "w") as f:
    json.dump(results, f)

print("--- Job Finished ---")
`