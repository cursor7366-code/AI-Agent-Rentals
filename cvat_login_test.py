#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_cvat_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Navigating to CVAT...")
        page.goto("https://app.cvat.ai/auth/login")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
        print("Page title:", page.title())
        
        # Take screenshot to see what we have
        page.screenshot(path="/home/clawdbot/clawd/cvat_login_page.png")
        print("Login page screenshot saved")
        
        # Print page content to find correct selectors
        print("Looking for input fields...")
        inputs = page.query_selector_all('input')
        for i, inp in enumerate(inputs):
            input_type = inp.get_attribute('type') or 'text'
            input_name = inp.get_attribute('name') or ''
            input_id = inp.get_attribute('id') or ''
            input_placeholder = inp.get_attribute('placeholder') or ''
            print(f"  Input {i}: type={input_type}, name={input_name}, id={input_id}, placeholder={input_placeholder}")
        
        # Try different selectors
        try:
            # Try by placeholder
            page.fill('input[placeholder*="user" i]', 'nicholas02', timeout=5000)
            print("Filled username by placeholder")
        except:
            try:
                # Try by id
                page.fill('#username', 'nicholas02', timeout=5000)
                print("Filled username by id")
            except:
                try:
                    # Try first text input
                    page.fill('input[type="text"]', 'nicholas02', timeout=5000)
                    print("Filled username by type=text")
                except Exception as e:
                    print(f"Could not fill username: {e}")
        
        try:
            page.fill('input[type="password"]', 'Allen04348', timeout=5000)
            print("Filled password")
        except Exception as e:
            print(f"Could not fill password: {e}")
        
        # Take screenshot after filling
        page.screenshot(path="/home/clawdbot/clawd/cvat_filled.png")
        print("Filled form screenshot saved")
        
        # Find and click submit button
        try:
            page.click('button[type="submit"]', timeout=5000)
            print("Clicked submit")
        except:
            try:
                page.click('button:has-text("Sign in")', timeout=5000)
                print("Clicked Sign in button")
            except:
                try:
                    page.click('button:has-text("Log in")', timeout=5000)
                    print("Clicked Log in button")
                except Exception as e:
                    print(f"Could not click login button: {e}")
        
        # Wait for navigation
        time.sleep(5)
        page.wait_for_load_state("networkidle")
        
        print("Current URL:", page.url)
        print("Page title:", page.title())
        
        # Take screenshot
        page.screenshot(path="/home/clawdbot/clawd/cvat_after_login.png")
        print("After login screenshot saved")
        
        browser.close()
        print("Done!")

if __name__ == "__main__":
    test_cvat_login()
