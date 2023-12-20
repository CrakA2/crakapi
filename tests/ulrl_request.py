import requests
import time

# Define the base URL of your API
base_url = "http://localhost:3000"

# Define the region and puuid
region = "ap"
puuid1 = "9cee3e42-2c1d-5878-a97a-04ad776df08e"
puuid2 = "9ac13b84-e393-5327-8b8b-d30998fba73d"

# Send 100 requests
for i in range(40):
    # Switch to the second puuid after 20 requests
    puuid = puuid1 if i < 20 else puuid2

    # Construct the URL for the request
    url = f"{base_url}/v1/rr/{region}/{puuid}?fs=json"

    response = requests.get(url)
    print(f"Request {i+1}: Status Code: {response.status_code} puuid: {puuid}")
    if response.status_code == 200:
        print("Response Body:", response.json())
    else:
        print("Response Text:", response.text)
    time.sleep(1)  # wait for 1 second before the next request