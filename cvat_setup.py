#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time
import os
import glob

SLIDES_DIR = "/home/clawdbot/clawd/cvat-slides/Slides"

def setup_cvat():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Login
        print("Logging in to CVAT...")
        page.goto("https://app.cvat.ai/auth/login")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        page.fill('input[type="text"]', 'nicholas02', timeout=5000)
        page.fill('input[type="password"]', 'Allen04348', timeout=5000)
        page.click('button[type="submit"]', timeout=5000)
        
        time.sleep(3)
        page.wait_for_load_state("networkidle")
        print("Logged in! URL:", page.url)
        
        # Go to Projects
        print("Going to Projects...")
        page.click('a:has-text("Projects")')
        time.sleep(2)
        page.wait_for_load_state("networkidle")
        
        # Create new project - click the blue + button
        print("Creating new project...")
        # The + button is a blue circle button on the right
        page.click('button.cvat-create-project-button', timeout=5000)
        time.sleep(1)
        
        page.screenshot(path="/home/clawdbot/clawd/cvat_create_project.png")
        print("Create project dialog screenshot saved")
        
        browser.close()
        print("Check the screenshot to see the dialog")

if __name__ == "__main__":
    setup_cvat()
