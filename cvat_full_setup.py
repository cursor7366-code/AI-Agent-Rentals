#!/usr/bin/env python3
"""
CVAT Project Setup for Al Brooks Slides Labeling
Creates project with proper labels and uploads slides
"""
from playwright.sync_api import sync_playwright
import time
import os
import glob

SLIDES_DIR = "/home/clawdbot/clawd/cvat-slides/Slides"

def setup_project():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Login
        print("=== Logging in to CVAT ===")
        page.goto("https://app.cvat.ai/auth/login")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        page.fill('input[type="text"]', 'nicholas02')
        page.fill('input[type="password"]', 'Allen04348')
        page.click('button[type="submit"]')
        time.sleep(3)
        page.wait_for_load_state("networkidle")
        print("Logged in!")
        
        # Navigate to create project
        print("\n=== Creating Project ===")
        page.click('a:has-text("Projects")')
        time.sleep(2)
        page.click('button.ant-btn-icon-only')
        time.sleep(1)
        page.click('text=Create a new project')
        time.sleep(2)
        
        # Fill project name
        page.fill('#name', 'Al Brooks Slides Labeling')
        print("Project name set")
        
        # Add labels using Constructor
        print("\n=== Adding Labels ===")
        
        # Add candle_box label (rectangle)
        print("Adding candle_box label...")
        page.click('text=Add label')
        time.sleep(1)
        
        page.screenshot(path='/home/clawdbot/clawd/cvat_add_label_dialog.png')
        
        # Find the label name input and fill it
        label_inputs = page.query_selector_all('input')
        for inp in label_inputs:
            placeholder = inp.get_attribute('placeholder') or ''
            if 'label' in placeholder.lower() or 'name' in placeholder.lower():
                inp.fill('candle_box')
                print(f"  Filled label name input (placeholder: {placeholder})")
                break
        
        time.sleep(1)
        page.screenshot(path='/home/clawdbot/clawd/cvat_label_filled.png')
        
        # Click done/continue to add this label
        try:
            page.click('button:has-text("Continue")', timeout=3000)
        except:
            try:
                page.click('button:has-text("Done")', timeout=3000)
            except:
                pass
        
        time.sleep(1)
        page.screenshot(path='/home/clawdbot/clawd/cvat_after_first_label.png')
        
        # Submit the project
        print("\n=== Submitting Project ===")
        page.click('button:has-text("Submit & Open")')
        time.sleep(3)
        page.wait_for_load_state("networkidle")
        
        page.screenshot(path='/home/clawdbot/clawd/cvat_project_created.png')
        print("Project page screenshot saved")
        print("Current URL:", page.url)
        
        browser.close()
        print("\nSetup complete! Check screenshots for results.")

if __name__ == "__main__":
    setup_project()
