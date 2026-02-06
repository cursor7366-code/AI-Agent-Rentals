#!/usr/bin/env python3
"""
St. Tammany Parish Code Enforcement Data Scraper

This scraper targets MGO Connect / MyGovernmentOnline for St. Tammany Parish, LA.
JurisdictionID: 34

Data sources:
1. MGO Connect API (requires authentication for Solution Center)
2. Administrative Hearing Dockets (PDFs - no auth required)
3. Parish website for document links

Author: Clawdbot
Date: 2026-02-01
"""

import requests
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class CodeEnforcementCase:
    """Data class for code enforcement case records"""
    case_number: str
    address: str
    city: str
    state: str
    zip_code: str
    case_type: str
    description: str
    status: str
    date_created: str
    source: str  # 'mgo_api' or 'hearing_docket'
    raw_data: Optional[Dict] = None


class MGOConnectClient:
    """
    Client for MGO Connect / MyGovernmentOnline API
    
    St. Tammany Parish JurisdictionID: 34
    """
    
    BASE_URL = "https://www.mygovernmentonline.org"
    API_URL = f"{BASE_URL}/api/helper"
    JURISDICTION_ID = 34  # St. Tammany Parish
    STATE_ID = "LA"
    
    def __init__(self, email: Optional[str] = None, password: Optional[str] = None):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        self.token = "GUEST"  # Default token for unauthenticated requests
        self.email = email
        self.password = password
        self.authenticated = False
        
    def authenticate(self) -> bool:
        """
        Authenticate with MGO Connect to get a session token.
        Required for Solution Center (code enforcement) searches.
        """
        if not self.email or not self.password:
            logger.warning("No credentials provided - using GUEST token (limited access)")
            return False
            
        # Note: Authentication flow requires analyzing the login process
        # The actual implementation would need to:
        # 1. POST to login endpoint with credentials
        # 2. Extract session token from response
        # 3. Store token for subsequent requests
        
        # Placeholder for auth implementation
        logger.info("Authentication not yet implemented - using GUEST token")
        return False
    
    def get_states(self) -> List[Dict]:
        """Get list of available states (works with GUEST token)"""
        url = f"{self.API_URL}/getstates/{self.token}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get states: {e}")
            return []
    
    def get_jurisdictions(self) -> List[Dict]:
        """Get list of available jurisdictions (works with GUEST token)"""
        url = f"{self.API_URL}/getjurisdictions/{self.token}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()
            # Filter for Louisiana
            la_jurisdictions = [j for j in data if j.get('StateID') == 'LA']
            return la_jurisdictions
        except Exception as e:
            logger.error(f"Failed to get jurisdictions: {e}")
            return []
    
    def get_sttammany_info(self) -> Optional[Dict]:
        """Get St. Tammany Parish jurisdiction details"""
        jurisdictions = self.get_jurisdictions()
        for j in jurisdictions:
            if j.get('JurisdictionID') == self.JURISDICTION_ID:
                return j
        return None
    
    def get_solution_center_types(self) -> List[Dict]:
        """Get available case types for Solution Center"""
        url = f"{self.API_URL}/getprojecttypesbysolutioncentertypes/{self.token}"
        payload = {
            "JurisdictionID": self.JURISDICTION_ID,
            "SectionID": 1
        }
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get solution center types: {e}")
            return []
    
    def search_solution_center(
        self,
        address: str = "",
        city: str = "",
        zip_code: str = "",
        case_number: str = "",
        project_type_id: int = -1
    ) -> List[CodeEnforcementCase]:
        """
        Search Solution Center for code enforcement cases.
        NOTE: Requires authentication - will fail with GUEST token.
        """
        if not self.authenticated:
            logger.warning("Solution Center search requires authentication")
            return []
        
        url = f"{self.API_URL}/searchsolutioncentercases/{self.token}"
        payload = {
            "CountryID": "1",
            "StateID": self.STATE_ID,
            "JurisdictionID": self.JURISDICTION_ID,
            "ProjectTypeID": project_type_id,
            "ProjectNumber": case_number,
            "Address": address,
            "City": city,
            "Zip": zip_code,
            "CreateDateFrom": None,
            "CreateDateTo": None
        }
        
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            cases = []
            for item in data:
                project = item.get('Project', item)
                case = CodeEnforcementCase(
                    case_number=project.get('ProjectNumber', ''),
                    address=project.get('ProjectAddress', ''),
                    city=project.get('ProjectCity', ''),
                    state=project.get('ProjectState', 'LA'),
                    zip_code=project.get('ProjectZip', ''),
                    case_type=project.get('WorkType', project.get('Type', '')),
                    description=project.get('Description', ''),
                    status=project.get('ProjectStatus', ''),
                    date_created=project.get('DateCreated', ''),
                    source='mgo_api',
                    raw_data=project
                )
                cases.append(case)
            
            return cases
        except Exception as e:
            logger.error(f"Solution Center search failed: {e}")
            return []


class HearingDocketScraper:
    """
    Scraper for Administrative Hearing Docket PDFs from St. Tammany Parish
    
    These PDFs contain code violation cases scheduled for administrative hearings.
    No authentication required.
    """
    
    BASE_URL = "https://www.stpgov.org/departments/civil_division_of_district_attorneys_office"
    
    def __init__(self, cache_dir: str = "./cache"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
    
    def get_docket_links(self) -> List[Dict[str, str]]:
        """
        Fetch the list of available hearing docket PDFs from the parish website.
        """
        url = f"{self.BASE_URL}/index.php"
        dockets = []
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            html = response.text
            
            # Extract PDF links
            # Pattern matches href="...Docket...pdf..." or href="...Admin...Hearing...pdf..."
            patterns = [
                r'href="([^"]*[Dd]ocket[^"]*\.pdf[^"]*)"',
                r'href="([^"]*[Aa]dmin[^"]*[Hh]earing[^"]*\.pdf[^"]*)"'
            ]
            
            found_urls = set()
            for pattern in patterns:
                matches = re.findall(pattern, html)
                for match in matches:
                    # Clean up URL
                    clean_url = match.split('?')[0]  # Remove cache-busting params
                    if clean_url not in found_urls:
                        found_urls.add(clean_url)
                        
                        # Determine year from filename
                        year_match = re.search(r'20\d{2}', clean_url)
                        year = year_match.group() if year_match else "unknown"
                        
                        # Build full URL if relative
                        if not clean_url.startswith('http'):
                            if clean_url.startswith('/'):
                                full_url = f"https://www.stpgov.org{clean_url}"
                            else:
                                full_url = f"{self.BASE_URL}/{clean_url}"
                        else:
                            full_url = clean_url
                        
                        dockets.append({
                            'url': full_url,
                            'filename': clean_url.split('/')[-1],
                            'year': year
                        })
            
            logger.info(f"Found {len(dockets)} hearing docket PDFs")
            return dockets
            
        except Exception as e:
            logger.error(f"Failed to get docket links: {e}")
            return []
    
    def download_docket(self, url: str, filename: str) -> Optional[Path]:
        """Download a docket PDF to cache"""
        cache_path = self.cache_dir / filename
        
        if cache_path.exists():
            logger.info(f"Using cached: {filename}")
            return cache_path
        
        try:
            logger.info(f"Downloading: {filename}")
            response = self.session.get(url, timeout=60)
            response.raise_for_status()
            
            # Verify it's actually a PDF
            if response.content[:4] != b'%PDF':
                logger.warning(f"Downloaded file is not a PDF: {filename}")
                return None
            
            cache_path.write_bytes(response.content)
            return cache_path
            
        except Exception as e:
            logger.error(f"Failed to download {filename}: {e}")
            return None
    
    def parse_docket_pdf(self, pdf_path: Path) -> List[CodeEnforcementCase]:
        """
        Parse a hearing docket PDF to extract case information.
        
        Note: Requires pdfplumber or similar library for full implementation.
        This is a placeholder that outlines the extraction logic.
        """
        cases = []
        
        try:
            # Try to use pdfplumber if available
            try:
                import pdfplumber
            except ImportError:
                logger.warning("pdfplumber not installed - PDF parsing limited")
                logger.info("Install with: pip install pdfplumber")
                return cases
            
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
                
                # Common patterns in hearing dockets:
                # - Case numbers: CE-2024-00123, 2024-CE-456, etc.
                # - Addresses: 123 Main St, Mandeville, LA 70471
                # - Hearing dates/times
                # - Respondent names
                
                # Extract case numbers
                case_pattern = r'(?:CE[-\s]?\d{4}[-\s]?\d+|\d{4}[-\s]?CE[-\s]?\d+)'
                case_numbers = re.findall(case_pattern, full_text, re.IGNORECASE)
                
                # Extract addresses (Louisiana address pattern)
                address_pattern = r'(\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Ct|Court)\.?[,\s]+(?:Mandeville|Covington|Slidell|Madisonville|Pearl River|Lacombe|Abita Springs|Folsom|Bush|Sun)[,\s]+LA\s+\d{5})'
                addresses = re.findall(address_pattern, full_text, re.IGNORECASE)
                
                logger.info(f"Found {len(case_numbers)} case numbers and {len(addresses)} addresses in {pdf_path.name}")
                
                # Create cases from extracted data
                # Note: More sophisticated parsing would be needed to properly associate
                # case numbers with their corresponding addresses
                for i, case_num in enumerate(case_numbers):
                    address = addresses[i] if i < len(addresses) else "Address parsing needed"
                    
                    # Parse address parts
                    addr_parts = address.split(',') if isinstance(address, str) else ['', '', '']
                    
                    case = CodeEnforcementCase(
                        case_number=case_num.strip(),
                        address=addr_parts[0].strip() if addr_parts else '',
                        city=addr_parts[1].strip() if len(addr_parts) > 1 else '',
                        state='LA',
                        zip_code=addr_parts[-1].strip().replace('LA', '').strip() if addr_parts else '',
                        case_type='Administrative Hearing',
                        description='Extracted from hearing docket PDF',
                        status='Scheduled for Hearing',
                        date_created=pdf_path.stem,  # Use filename as date reference
                        source='hearing_docket',
                        raw_data={'pdf_source': str(pdf_path)}
                    )
                    cases.append(case)
        
        except Exception as e:
            logger.error(f"Error parsing PDF {pdf_path}: {e}")
        
        return cases


class StTammanyCodeEnforcementScraper:
    """
    Main scraper class combining all data sources for St. Tammany Parish
    """
    
    def __init__(
        self,
        email: Optional[str] = None,
        password: Optional[str] = None,
        cache_dir: str = "./cache"
    ):
        self.mgo_client = MGOConnectClient(email, password)
        self.docket_scraper = HearingDocketScraper(cache_dir)
        self.cases: List[CodeEnforcementCase] = []
    
    def verify_connection(self) -> bool:
        """Verify we can connect to the data sources"""
        logger.info("Verifying connection to MGO Connect...")
        
        # Test API access
        sttammany = self.mgo_client.get_sttammany_info()
        if sttammany:
            logger.info(f"St. Tammany Parish found in MGO Connect:")
            logger.info(f"  JurisdictionID: {sttammany['JurisdictionID']}")
            logger.info(f"  Solution Center Online: {sttammany.get('IsSolutionCenterOnline', False)}")
            logger.info(f"  Apply Online: {sttammany.get('IsApplyOnline', False)}")
            return True
        else:
            logger.error("Could not find St. Tammany Parish in MGO Connect")
            return False
    
    def scrape_hearing_dockets(self, years: Optional[List[str]] = None) -> List[CodeEnforcementCase]:
        """
        Scrape administrative hearing docket PDFs.
        
        Args:
            years: Optional list of years to filter (e.g., ['2024', '2025'])
        """
        logger.info("Scraping administrative hearing dockets...")
        
        dockets = self.docket_scraper.get_docket_links()
        
        if years:
            dockets = [d for d in dockets if d['year'] in years]
        
        for docket in dockets:
            pdf_path = self.docket_scraper.download_docket(docket['url'], docket['filename'])
            if pdf_path:
                cases = self.docket_scraper.parse_docket_pdf(pdf_path)
                self.cases.extend(cases)
                logger.info(f"Extracted {len(cases)} cases from {docket['filename']}")
            
            # Be respectful with rate limiting
            time.sleep(1)
        
        return self.cases
    
    def scrape_solution_center(
        self,
        address: str = "",
        city: str = "",
        zip_code: str = ""
    ) -> List[CodeEnforcementCase]:
        """
        Search MGO Connect Solution Center for code enforcement cases.
        Requires authentication.
        """
        if not self.mgo_client.authenticated:
            logger.warning("Solution Center requires authentication")
            logger.info("Set email and password credentials to enable this feature")
            return []
        
        cases = self.mgo_client.search_solution_center(
            address=address,
            city=city,
            zip_code=zip_code
        )
        self.cases.extend(cases)
        return cases
    
    def export_to_json(self, filepath: str) -> None:
        """Export scraped cases to JSON file"""
        data = {
            'jurisdiction': 'St. Tammany Parish',
            'jurisdiction_id': 34,
            'scraped_at': datetime.now().isoformat(),
            'total_cases': len(self.cases),
            'cases': [asdict(case) for case in self.cases]
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        logger.info(f"Exported {len(self.cases)} cases to {filepath}")
    
    def export_to_csv(self, filepath: str) -> None:
        """Export scraped cases to CSV file"""
        import csv
        
        if not self.cases:
            logger.warning("No cases to export")
            return
        
        fieldnames = [
            'case_number', 'address', 'city', 'state', 'zip_code',
            'case_type', 'description', 'status', 'date_created', 'source'
        ]
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for case in self.cases:
                row = asdict(case)
                del row['raw_data']  # Don't include raw data in CSV
                writer.writerow(row)
        
        logger.info(f"Exported {len(self.cases)} cases to {filepath}")


def main():
    """Main entry point for the scraper"""
    
    # Initialize scraper
    # To enable Solution Center access, provide MGO Connect credentials:
    # scraper = StTammanyCodeEnforcementScraper(
    #     email="your_email@example.com",
    #     password="your_password"
    # )
    scraper = StTammanyCodeEnforcementScraper(cache_dir="./cache")
    
    # Verify connection
    if not scraper.verify_connection():
        logger.error("Failed to verify connection")
        return
    
    # Scrape hearing dockets (no auth required)
    logger.info("\n=== Scraping Hearing Dockets ===")
    scraper.scrape_hearing_dockets(years=['2025', '2026'])
    
    # Export results
    output_dir = Path("./output")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    scraper.export_to_json(f"./output/sttammany_code_enforcement_{timestamp}.json")
    scraper.export_to_csv(f"./output/sttammany_code_enforcement_{timestamp}.csv")
    
    logger.info(f"\nComplete! Scraped {len(scraper.cases)} code enforcement cases")


if __name__ == "__main__":
    main()
