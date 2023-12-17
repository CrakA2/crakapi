import requests
import datetime
import os
import time
import threading
import json

# Global variables
puuid = "a11edb49-8856-5948-9f07-7c9d010fa15e"
region = "ap"
mmr_current = None
winr = 0
lossr = 0
'''
# Additional variables for the second script
API_ENDPOINT = f"https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/{region}/{puuid}"
PARAMS = {"mode": "competitive", "size": 1}
HEADERS = {"Content-Type": "application/json"}
OUTPUT_FILE = '/var/www/html/hs.txt'
'''
# Function to check and create a file if it doesn't exist
def check_and_create_file(filename):
    if not os.path.exists(filename):
        with open(filename, 'w') as file:
            pass

# Function to fetch Ranked Rating and save to rr.txt
def ranked_rating():
    check_and_create_file("rr.txt")
    url = f"https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr/{region}/{puuid}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()["data"]
        current_tier_patched = data["currenttierpatched"]
        ranking_in_tier = data["ranking_in_tier"]
        with open("./rr.txt", "w") as file:
            file.write(f"{current_tier_patched} {ranking_in_tier} RR\n")

# Function to fetch leaderboard rank and save to lb.txt
def leaderboard_rank():
    check_and_create_file("lb.txt")
    url = f"https://api.henrikdev.xyz/valorant/v2/leaderboard/{region}?puuid={puuid}"
    response = requests.get(url)
    if response.status_code == 200:
        players = response.json()["data"]  # <-- Changed "players" to "data"
        for player in players:
            if player["puuid"] == puuid:
                leaderboard_rank = player["leaderboardRank"]
                with open("./lb.txt", "w") as file:
                    file.write(f"{leaderboard_rank}\n")
                break


def calculate_headshot_percentage():
    check_and_create_file("hs.txt")
    url = f"https://api.henrikdev.xyz/valorant/v1/by-puuid/lifetime/matches/{region}/{puuid}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()["data"]
        shots = data[0]["stats"]["shots"]
        total_shots = shots["head"] + shots["body"] + shots["leg"]
        headshots = shots["head"]
        headshot_percentage = (headshots / total_shots) * 100 if total_shots > 0 else 0
        headshot_percentage = round(headshot_percentage, 1)
        with open("./hs.txt", "w") as file:
            file.write(f"Headshot percentage: {headshot_percentage}%\n")


calculate_headshot_percentage()
leaderboard_rank()
ranked_rating()