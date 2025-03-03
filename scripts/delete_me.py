from datetime import datetime

# Get current local time
local_time = datetime.now()

print("Local Time:", local_time.strftime("%Y-%m-%d %I:%M:%S %p"))
