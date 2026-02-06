# St. Tammany Parish Code Enforcement - Technical Assessment

## Executive Summary

St. Tammany Parish uses **MGO Connect / MyPermitNow** (NOT Tyler Energov) for permits and code enforcement tracking. This is a Louisiana-based system from South Central Planning & Development Commission (SCPDC).

**Key Finding:** The system has a public API that accepts GUEST tokens for read operations.

---

## Platform Analysis

### Software Platform
- **Vendor:** South Central Planning & Development Commission (SCPDC)
- **Product:** MGO Connect / MyGovernmentOnline / MyPermitNow
- **Technology Stack:** ASP.NET, Microsoft IIS, Kendo UI
- **NOT Tyler Energov** (contrary to initial assumption)

### St. Tammany Parish Configuration
```json
{
  "JurisdictionID": 34,
  "Jurisdiction": "St. Tammany",
  "StateID": "LA",
  "IsApplyOnline": true,
  "IsSolutionCenterOnline": true,  // CODE ENFORCEMENT IS AVAILABLE
  "IsPayOnline": true,
  "CustomerPortalEmail": "notifications@mypermitnow.org",
  "ComplaintEmail": "notifications@mypermitnow.org"
}
```

---

## Available Data Sources

### 1. MGO Connect API (Primary - Permits & Code Enforcement)

**Base URL:** `https://www.mygovernmentonline.org/api/helper/`

**Key Endpoints:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/getstates/{token}` | GET | GUEST | List available states |
| `/getjurisdictions/{token}` | GET | GUEST | List jurisdictions |
| `/searchsolutioncentercases/{token}` | POST | LOGIN | Search code enforcement cases |
| `/searchprojects/{token}` | POST | LOGIN | Search permits |
| `/getprojecttypesbysolutioncentertypes/{token}` | POST | GUEST | Get case types |
| `/getprojecttypesbypermittypes/{token}` | POST | LOGIN | Get permit types |

**Authentication:**
- Basic searches: Use `GUEST` token
- Case details: Requires account login
- Solution Center (code enforcement) search requires authentication

**Request Format:**
```javascript
POST /api/helper/searchsolutioncentercases/{token}
Content-Type: application/json

{
  "CountryID": "1",
  "StateID": "LA", 
  "JurisdictionID": 34,
  "ProjectTypeID": -1,
  "ProjectNumber": "",
  "Address": "",
  "City": "",
  "Zip": ""
}
```

**Response Schema (Solution Center Case):**
```javascript
{
  "ProjectID": 12345,
  "ProjectNumber": "CE2024-00123",
  "JurisdictionID": 34,
  "Jurisdiction": "St. Tammany",
  "TypeID": 5,
  "Type": "Code Enforcement",
  "WorkType": "Nuisance Abatement",
  "Description": "Overgrown vegetation",
  "ProjectAddress": "123 Main St",
  "ProjectCity": "Mandeville",
  "ProjectState": "LA",
  "ProjectZip": "70471",
  "DateCreated": "2024-01-15T00:00:00"
}
```

### 2. Administrative Hearing Dockets (PDF - Code Violations)

**Source:** St. Tammany Parish Civil Division of District Attorney
**URL Pattern:** `https://www.stpgov.org/departments/civil_division_of_district_attorneys_office/`

**Available Files:**
- Current docket: `20260114 Docket_FINAL.pdf`
- Annual archives: `2025 Admin Hearing Dockets.pdf`, `2024 Admin Hearing Dockets.pdf`, etc.
- Historical data from 2009-present

**Content:** Lists code violation cases scheduled for administrative hearings with:
- Case numbers
- Property addresses
- Violation types
- Hearing dates
- Property owner names

**Update Frequency:** Updated per hearing schedule (typically monthly)

### 3. Building Permit Data (PDF)

**URL:** `http://www3.stpgov.org/pdf/BuildingPermitData.pdf`
**Format:** PDF report
**Note:** May be archived or deprecated

### 4. Property Assessor Data

**URL:** `https://arist.stassessor.org/propertysearch.html`
**Format:** Web search interface (Aumentum ARIST system)
**Data:** Property assessments, ownership, land values

---

## Code Enforcement Complaint Submission

**Complaint Form URL:** `https://www.stpgov.org/complaints___requests/a_code_enforcement_complaint.php`

**Process:**
- Citizens submit complaints via web form
- Cases enter MGO Connect Solution Center
- Cases proceed through administrative hearing process

---

## Technical Implementation Notes

### API Access Strategy

1. **Anonymous/GUEST access** provides:
   - Jurisdiction list
   - State list
   - Project type lists (for building dropdowns)

2. **Authenticated access** required for:
   - Solution Center case search
   - Permit details
   - Case attachments

3. **PDF scraping** for hearing dockets:
   - No authentication needed
   - Regular scraping can capture violation addresses
   - PDF structure is fairly consistent

### Authentication Options

**Option A: Create Account (Recommended)**
- Register at https://www.mgoconnect.org or https://www.mygovernmentonline.org/createaccount/
- Free account provides search access
- API token obtained post-login

**Option B: Public Records Request**
- Request bulk data export from Parish
- May require FOIA/public records process

### Scraping Recommendations

1. **Start with PDF dockets** - No auth required, direct violation data
2. **Build authenticated API client** for Solution Center
3. **Cross-reference with Assessor** for property ownership

---

## Data Fields Available

### Code Enforcement Case (from MGO Solution Center)
- Case Number (ProjectNumber)
- Case Type (WorkType)
- Description
- Property Address (full)
- Status
- Create Date
- Applicant/Respondent info

### Administrative Hearing Docket (from PDFs)
- Docket Number
- Hearing Date/Time
- Property Address
- Violation Type
- Respondent Name
- Continuance Status

---

## Rate Limits & Constraints

- No documented rate limits found
- PDF downloads should be cached
- API calls should include reasonable delays (1-2 sec between requests)
- Solution Center requires login session management

---

## Recommended Approach

### Phase 1: PDF Docket Scraping (Immediate)
- Scrape administrative hearing docket PDFs
- Parse case information
- No authentication needed

### Phase 2: MGO API Integration (After Account Setup)
- Create MGO Connect account
- Implement authenticated API calls
- Search Solution Center for detailed case data

### Phase 3: Property Cross-Reference
- Link code enforcement addresses to Assessor records
- Enrich with property ownership and value data

---

## Contact Information

**Permits & Inspections Department**
- Address: 21454 Koop Drive, Building B, Ste. 1B, Mandeville, LA 70471
- Phone: 985-646-4166
- Hours: Monday-Friday, 8am-4pm

**Code Enforcement Complaint Email:** notifications@mypermitnow.org
