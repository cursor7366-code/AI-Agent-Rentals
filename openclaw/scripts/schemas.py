"""
OpenClaw Extraction Schemas (Pydantic)

These mirror the JSON schemas in opint_config/schemas/.
All fields nullable except source_url.
NO INFERENCE. NO ENRICHMENT. NULL if not explicitly present.
"""

from typing import Optional
from pydantic import BaseModel, Field


class CivilDocket(BaseModel):
    """Civil Court Dockets - Foreclosures / Judgments / Evictions"""
    
    case_id: Optional[str] = None
    court_name: Optional[str] = None
    jurisdiction: Optional[str] = None
    filing_type: Optional[str] = None  # Literal, e.g. "Petition for Foreclosure"
    filing_date: Optional[str] = None
    party_plaintiff: Optional[str] = None
    party_defendant: Optional[str] = None
    property_address: Optional[str] = None
    document_type: Optional[str] = None
    document_url: Optional[str] = None
    status: Optional[str] = None  # ONLY if explicitly stated
    raw_text_excerpt: Optional[str] = None
    source_url: str
    confidence_score: Optional[float] = Field(None, ge=0, le=1)  # Required if OCR used
    
    class Config:
        extra = "forbid"  # No additional fields allowed


class TaxSale(BaseModel):
    """Tax Sales / Tax Delinquency records"""
    
    parcel_id: Optional[str] = None
    property_address: Optional[str] = None
    owner_name: Optional[str] = None
    tax_year: Optional[str] = None
    amount_due: Optional[str] = None  # Keep original format
    sale_date: Optional[str] = None
    redemption_deadline: Optional[str] = None
    status: Optional[str] = None  # ONLY if explicitly stated
    document_url: Optional[str] = None
    source_url: str
    raw_text_excerpt: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    
    class Config:
        extra = "forbid"


class CodeViolation(BaseModel):
    """Code Violations / Compliance Notices"""
    
    case_number: Optional[str] = None
    property_address: Optional[str] = None
    violation_type: Optional[str] = None
    violation_description: Optional[str] = None
    issue_date: Optional[str] = None
    compliance_deadline: Optional[str] = None
    issuing_authority: Optional[str] = None
    status: Optional[str] = None  # ONLY if explicitly stated
    document_url: Optional[str] = None
    source_url: str
    raw_text_excerpt: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    
    class Config:
        extra = "forbid"


class Permit(BaseModel):
    """Permits - Applications / Failures / Withdrawals"""
    
    permit_number: Optional[str] = None
    property_address: Optional[str] = None
    permit_type: Optional[str] = None
    application_date: Optional[str] = None
    status: Optional[str] = None  # applied/approved/failed/withdrawn
    failure_reason: Optional[str] = None
    issuing_department: Optional[str] = None
    document_url: Optional[str] = None
    source_url: str
    raw_text_excerpt: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    
    class Config:
        extra = "forbid"


# Domain to schema mapping
DOMAIN_SCHEMAS = {
    "civil_court_dockets": CivilDocket,
    "tax_sales": TaxSale,
    "code_violations": CodeViolation,
    "permits": Permit,
}


def get_schema_for_domain(domain: str):
    """Get the Pydantic schema class for a domain"""
    if domain not in DOMAIN_SCHEMAS:
        raise ValueError(f"Unknown domain: {domain}. Valid: {list(DOMAIN_SCHEMAS.keys())}")
    return DOMAIN_SCHEMAS[domain]


def validate_record(domain: str, data: dict) -> tuple[bool, Optional[BaseModel], list[str]]:
    """
    Validate a record against its domain schema.
    
    Returns:
        (is_valid, model_instance_or_none, list_of_errors)
    """
    schema_class = get_schema_for_domain(domain)
    errors = []
    
    try:
        instance = schema_class(**data)
        return True, instance, []
    except Exception as e:
        errors.append(str(e))
        return False, None, errors
