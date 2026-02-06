"""
OpenClaw Configuration Loader

Loads and validates all required config files.
STOPS cycle if required configs are missing.
"""

import hashlib
import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, field_validator


class SourceConfig(BaseModel):
    """Single source configuration"""
    source_id: str
    domain: str
    source_url: str
    content_selector: str | None = None
    follow_mode: str = "none"  # none | one_hop
    follow_link_selectors: list[str] = []
    max_pages_per_cycle: int = 50
    base_interval_minutes: int = 360
    priority: str = "normal"  # high | normal | low
    
    @field_validator("source_id")
    @classmethod
    def source_id_stable(cls, v: str) -> str:
        """Source ID must be stable - no whitespace, lowercase"""
        return v.strip().lower().replace(" ", "_")


class SourcesConfig(BaseModel):
    """sources.json schema"""
    version: int = 1
    sources: list[SourceConfig] = []


class ThresholdsConfig(BaseModel):
    """thresholds.json schema"""
    version: int = 1
    MAX_SOURCES_PER_CYCLE: int = 5
    MAX_RUNTIME_MIN_PER_CYCLE: int = 45
    MIN_REQUEST_DELAY_S: int = 2
    MAX_REQUEST_DELAY_S: int = 6
    MAX_CONCURRENT_FETCHES: int = 6
    MAX_CONCURRENT_EXTRACTIONS: int = 2
    FETCH_TIMEOUT_S: int = 30
    RETRY_MAX_ATTEMPTS: int = 2
    OCR_CONFIDENCE_THRESHOLD: float = 0.9
    QUARANTINE_THRESHOLD: float = 0.2
    X_NO_CHANGE_CYCLES: int = 3
    MAX_PRIORITY_MULTIPLIER: int = 16


class Config:
    """
    Central configuration holder.
    
    Usage:
        config = Config.load("/app/opint_config")
        # If load fails, it raises ConfigError (STOP condition)
    """
    
    def __init__(
        self,
        sources: SourcesConfig,
        thresholds: ThresholdsConfig,
        config_dir: Path,
        fingerprint: str
    ):
        self.sources = sources
        self.thresholds = thresholds
        self.config_dir = config_dir
        self.fingerprint = fingerprint
    
    @classmethod
    def load(cls, config_dir: str | Path) -> "Config":
        """
        Load all config files.
        
        Raises ConfigError (STOP) if:
        - sources.json missing
        - thresholds.json missing
        - schemas/ directory missing
        - Any validation error
        """
        config_dir = Path(config_dir)
        missing = []
        
        # Check required files
        sources_path = config_dir / "sources.json"
        thresholds_path = config_dir / "thresholds.json"
        schemas_dir = config_dir / "schemas"
        
        if not sources_path.exists():
            missing.append("sources.json")
        if not thresholds_path.exists():
            missing.append("thresholds.json")
        if not schemas_dir.exists():
            missing.append("schemas/")
        
        if missing:
            raise ConfigError(f"Owner config incomplete: {', '.join(missing)}")
        
        # Load and validate
        try:
            sources_data = json.loads(sources_path.read_text())
            sources = SourcesConfig(**sources_data)
        except Exception as e:
            raise ConfigError(f"Invalid sources.json: {e}")
        
        try:
            thresholds_data = json.loads(thresholds_path.read_text())
            thresholds = ThresholdsConfig(**thresholds_data)
        except Exception as e:
            raise ConfigError(f"Invalid thresholds.json: {e}")
        
        # Compute config fingerprint for manifest
        fingerprint = cls._compute_fingerprint(sources_path, thresholds_path, schemas_dir)
        
        return cls(
            sources=sources,
            thresholds=thresholds,
            config_dir=config_dir,
            fingerprint=fingerprint
        )
    
    @staticmethod
    def _compute_fingerprint(sources_path: Path, thresholds_path: Path, schemas_dir: Path) -> str:
        """Compute deterministic hash of config state"""
        hasher = hashlib.sha256()
        
        # Hash sources.json
        hasher.update(sources_path.read_bytes())
        
        # Hash thresholds.json
        hasher.update(thresholds_path.read_bytes())
        
        # Hash all schema files (sorted for determinism)
        if schemas_dir.exists():
            for schema_file in sorted(schemas_dir.glob("*.json")):
                hasher.update(schema_file.read_bytes())
        
        return hasher.hexdigest()
    
    def get_allowed_domains(self) -> set[str]:
        """Extract unique hostnames from all source URLs"""
        from urllib.parse import urlparse
        domains = set()
        for source in self.sources.sources:
            parsed = urlparse(source.source_url)
            if parsed.hostname:
                domains.add(parsed.hostname)
        return domains


class ConfigError(Exception):
    """Fatal config error - STOP condition"""
    pass
