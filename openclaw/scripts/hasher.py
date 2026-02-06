"""
OpenClaw Structural Hasher

Computes deterministic hashes of content for change detection.
Only substantive content changes trigger re-extraction.
"""

import hashlib
import re
import unicodedata
from typing import Optional

from bs4 import BeautifulSoup


def compute_structural_hash(
    text: str,
    content_selector: Optional[str] = None,
    raw_html: Optional[bytes] = None
) -> tuple[str, str]:
    """
    Compute structural hash of content.
    
    Args:
        text: Extracted text content
        content_selector: CSS selector to focus on (for HTML)
        raw_html: Raw HTML bytes (if available, for selector extraction)
    
    Returns:
        (structural_hash, preview) - sha256 hex and first 200 chars
    
    Rules (from spec):
    - Unicode normalize (NFKC)
    - Lowercase
    - Collapse whitespace
    - Remove known noise patterns (timestamps like "Last updated...")
    - Do NOT remove all numbers (docket/permit IDs are signal)
    """
    # If we have raw HTML and a selector, extract from selector
    if raw_html and content_selector:
        text = extract_with_selector(raw_html, content_selector)
    
    # Normalize
    normalized = normalize_text(text)
    
    # Hash
    hash_hex = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    
    # Preview (first 200 chars of normalized)
    preview = normalized[:200]
    
    return hash_hex, preview


def extract_with_selector(html_bytes: bytes, selector: str) -> str:
    """Extract text from HTML using CSS selector"""
    try:
        soup = BeautifulSoup(html_bytes, "lxml")
        
        # Find elements matching selector
        elements = soup.select(selector)
        
        if not elements:
            # Selector found nothing - fall back to body
            elements = soup.select("body")
        
        # Extract text from matched elements
        texts = []
        for el in elements:
            # Remove script/style within
            for tag in el(["script", "style"]):
                tag.decompose()
            texts.append(el.get_text(separator=" ", strip=True))
        
        return " ".join(texts)
        
    except Exception:
        # On any parse error, return empty (will be handled by caller)
        return ""


def normalize_text(text: str) -> str:
    """
    Deterministic text normalization for hashing.
    
    Steps:
    1. Unicode NFKC normalization
    2. Lowercase
    3. Remove known noise patterns
    4. Collapse whitespace
    """
    # Step 1: Unicode normalize
    text = unicodedata.normalize("NFKC", text)
    
    # Step 2: Lowercase
    text = text.lower()
    
    # Step 3: Remove known noise patterns
    text = remove_noise_patterns(text)
    
    # Step 4: Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    
    return text


def remove_noise_patterns(text: str) -> str:
    """
    Remove known noise that changes frequently but isn't signal.
    
    Patterns removed:
    - "Last updated: <date/time>"
    - "Page generated at: <timestamp>"
    - "Retrieved on <date>"
    - Visitor counters
    - Copyright year updates
    
    NOT removed:
    - Docket numbers (e.g., "2024-CV-12345")
    - Permit numbers
    - Case IDs
    - Any alphanumeric identifier
    """
    patterns = [
        # Timestamps
        r"last\s+updated[:\s]+[\d/\-:\s]+(?:am|pm)?",
        r"page\s+generated[:\s]+[\d/\-:\s]+(?:am|pm)?",
        r"retrieved\s+on[:\s]+[\d/\-:\s]+",
        r"as\s+of[:\s]+[\d/\-:\s]+(?:am|pm)?",
        
        # Counters
        r"page\s+views?[:\s]+[\d,]+",
        r"visitors?[:\s]+[\d,]+",
        
        # Generic timestamps (be careful - only obvious ones)
        r"\d{1,2}:\d{2}:\d{2}\s*(?:am|pm)",  # Time only
        r"(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+\d{1,2},?\s+\d{4}",  # Day, Month DD, YYYY
    ]
    
    for pattern in patterns:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)
    
    return text


def compute_raw_hash(content: bytes) -> str:
    """Simple hash of raw bytes (for comparison/debugging)"""
    return hashlib.sha256(content).hexdigest()
