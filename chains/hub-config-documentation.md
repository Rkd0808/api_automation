# Hub Configuration Dynamic API Test Documentation

## Overview
This document provides a comprehensive breakdown of the `hub-config-dynamic.api.spec.js` Playwright test script. The script automates the creation of a complete hub configuration workflow for Safexpress's logistics hub management system. It demonstrates API testing patterns using Playwright's `request` fixture, focusing on REST API calls rather than UI interactions.

The test creates a full hub configuration from scratch, including basic config, layout, buildings, gates, offices, inventory, operations, and process configurations. It uses dynamic data where possible, fetching lookup values and generating unique IDs.

## Prerequisites

### Environment Setup
- **Node.js and Playwright**: Ensure Playwright is installed and configured
- **API Base URL**: `https://2cdifi6676.execute-api.ap-south-1.amazonaws.com/qa/hcmservice/v1/hub/configurations`
- **Authentication Token**: A long JWT token (hardcoded in the script as `token`)
- **User ID**: `80618`
- **Module Permissions**: `INVENTORY, LAYOUT_DESIGN, PROCESS, HUB_FEATURE,OPERATIONAL,BASIC`

### Required Files
- `dummy.pdf`: A sample PDF file used for layout basic configuration multipart upload (must exist in the project root)

### Environment Variables (Recommended)
While hardcoded in the script, these should ideally be environment variables:
- `PROPELI_API_TOKEN`: Bearer token
- `PROPELI_USER_ID`: User ID
- `PROPELI_MODULE_PERMISSIONS`: Comma-separated permissions
- `PROPELI_API_BASE_URL`: API base URL

## Authentication Details
All API calls use Bearer token authentication with additional headers:
- `Authorization: Bearer ${token}`
- `userid: '80618'`
- `X-ModulePermissions: 'INVENTORY, LAYOUT_DESIGN, PROCESS, HUB_FEATURE,OPERATIONAL,BASIC'`
- `Accept: '*/*'`
- `Content-Type: 'application/json'` (except for multipart uploads)

## API Workflow Flow

The test follows a sequential workflow where each step depends on data from previous steps. Here's the complete flow:

### Step 1: Fetch Branches
**Purpose**: Retrieve available branches to select one for hub configuration.

**API Details**:
- **Method**: GET
- **Endpoint**: `${baseUrl}/branches`
- **Headers**: Standard auth headers
- **Body**: None
- **Pre-data Required**: None
- **Response**: Array of branch objects with `branchId`, `branchName`, etc.
- **Data Extraction**: Selects first branch (or active status 0). Extracts `branchId` and `branchName`.
- **Unique Values**: Uses existing branch IDs from the system.

### Step 2: Create Hub Basic Configuration
**Purpose**: Create the initial hub configuration with branch details.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/basic-configs`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "basicConfigId": null,
    "branchId": "<from_step_1>",
    "branchName": "<from_step_1>",
    "startDate": "<tomorrow's_date_YYYY-MM-DD>",
    "endDate": "",
    "basicLkpDraftActive": "SAVE_NEXT",
    "status": true,
    "future": false
  }
  ```
- **Pre-data Required**: `branchId` and `branchName` from Step 1
- **Response**: Contains `hubConfig.id` or `hubConfigId`
- **Data Extraction**: Extracts `configId` for subsequent calls
- **Unique Values**: `startDate` is dynamically set to tomorrow

### Step 3: Create Layout Basic Configuration
**Purpose**: Configure basic layout dimensions and orientation with file upload.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/layoutBasic`
- **Headers**: Standard auth headers (Content-Type set automatically for multipart)
- **Body**: Multipart form data
  - `layoutBasicRequest`: JSON string with layout details
  - `files`: PDF file upload
- **Multipart Payload**:
  ```json
  {
    "layoutBasicRequest": {
      "name": "blob",
      "mimeType": "application/json",
      "buffer": "<JSON_string>"
    },
    "files": {
      "name": "dummy.pdf",
      "mimeType": "application/pdf",
      "buffer": "<file_buffer>"
    }
  }
  ```
- **JSON Content**:
  ```json
  {
    "layoutBasicId": "",
    "layoutLength": 100,
    "layoutBreadth": 200,
    "lkpDraftActive": "SAVE_NEXT",
    "lkpHubOrientationId": 3601,
    "branchSharingPremise": false,
    "sharingBranchResponseDTOList": []
  }
  ```
- **Pre-data Required**: `configId` from Step 2
- **Response**: Contains layout details with generated IDs
- **Unique Values**: `lkpHubOrientationId: 3601` (hardcoded as NORTH), file upload required

### Step 4: Fetch Existing Building Configuration Structure
**Purpose**: Check if there's an existing building template to reuse.

**API Details**:
- **Method**: GET
- **Endpoint**: `${baseUrl}/${configId}/layout/buildings?lkpDraftActive=DRAFT`
- **Headers**: Standard auth headers
- **Body**: None
- **Pre-data Required**: `configId` from Step 2
- **Response**: Building structure if exists, otherwise 404-like response
- **Data Processing**: If exists, nullify IDs and update draft status for creation

### Step 5: Prepare Building Configuration Payload
**Purpose**: Dynamically create building configuration based on existing structure or default template.

**Data Sources**:
- If existing structure found: Transform it (nullify IDs, change draft to SAVE_NEXT)
- If no existing: Use hardcoded default structure with multiple LOBs (Delivery, Transshipment, Feeder, Multi-Service)

**Default Structure Includes**:
- 1 Building with 4 Lines of Business (LOBs)
- Each LOB has shutters and docks with specific service types
- Hardcoded lookup IDs for types, orientations, dimensions

**Unique Values**:
- Lookup IDs: `lkpLineOfBusinessId` (3861=Delivery, 3860=Transshipment, etc.)
- `lkpShutterTypeId` (5=Delivery Shutter, 6=Transshipment Shutter, etc.)
- `lkpOrientationId: '3601'` (NORTH)
- `lkpDimensionId: '3765'` (14X16)
- `lkpDockTypeId: '3767'` (FIXED)
- `lkpDockSizeId: '3609'` (14 inches)
- Service type IDs for each dock

### Step 6: Create Building Configuration
**Purpose**: Submit the building configuration.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/layout/buildings`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Building payload from Step 5
- **Pre-data Required**: `configId` from Step 2, building data structure
- **Response**: Success confirmation with building count
- **Validation**: Expects `sfxStatusCode: 'HCDS004'`

### Step 7: Fetch Lookup Data
**Purpose**: Get dynamic lookup values for gates and orientations.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/load`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "lookupType": ["GATE_TYPE", "ORIENTATION", "INACTIVE_REASON_GATES"]
  }
  ```
- **Pre-data Required**: None
- **Response**: Lookup data with IDs and values
- **Data Extraction**: Randomly selects gate type and orientation IDs
- **Unique Values**: Dynamic selection from available options

### Step 8: Create Hub Entry/Exit Gate Configuration
**Purpose**: Configure gates with dynamic lookup values.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/layout/hub-entry-exit-gates`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "id": null,
    "gateAvailable": "true",
    "lkpDraftActive": "SAVE_NEXT",
    "getDetails": [
      {
        "gateNo": 1,
        "lkpGateTypeId": "<random_from_lookup>",
        "lkpGateOrientationId": "<random_from_lookup>",
        "status": "true"
      }
    ]
  }
  ```
- **Pre-data Required**: `configId` from Step 2, lookup IDs from Step 7
- **Response**: Success confirmation
- **Unique Values**: Randomly selected gate type and orientation IDs

### Step 9: Create Office Configuration
**Purpose**: Configure office spaces.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/offices`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "officeAvailable": true,
    "lkpDraftActive": "SAVE_NEXT",
    "officeDetails": [
      {
        "length": 50,
        "width": 30,
        "lkpOfficeOrientationId": "<from_step_7>",
        "buildingNo": 1,
        "noOfficeConfRoom": 1
      }
    ]
  }
  ```
- **Pre-data Required**: `configId` from Step 2, orientation ID from Step 7
- **Response**: Success with `sfxStatusCode: 'HCDS010'`
- **Unique Values**: Uses orientation ID from lookup

### Step 10: Create Unitization Inventory
**Purpose**: Configure unitization equipment inventory.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/inventory/unitization`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "hub_config_id": "<configId>",
    "lkp_inv_type_id": 3752,
    "is_inv_exists": true,
    "lkp_draft_active": "save_next",
    "inv_details": [
      {
        "lkp_inv_sub_type_id": 4086,
        "unique_ids": [],
        "non_unique_ids": [
          {
            "assign_date": "06-11-2025",
            "end_date": "",
            "count": 5
          }
        ]
      }
    ],
    "inv_count": 5
  }
  ```
- **Pre-data Required**: `configId` from Step 2
- **Response**: Inventory creation confirmation
- **Unique Values**: `lkp_inv_type_id: 3752` (Unitization), `lkp_inv_sub_type_id: 4086`

### Step 11: Create MHE Inventory
**Purpose**: Configure Material Handling Equipment inventory.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/inventory/mhe`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Similar to Unitization but with `lkp_inv_type_id: 3753`, `lkp_inv_sub_type_id: 3718`
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: `lkp_inv_type_id: 3753` (MHE), `lkp_inv_sub_type_id: 3718`

### Step 12: Create Electronic Devices Inventory
**Purpose**: Configure electronic devices inventory.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/inventory/electronic-devices`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Similar structure with `lkp_inv_type_id: 3754`, `lkp_inv_sub_type_id: 3723`
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: `lkp_inv_type_id: 3754` (Electronic Devices), `lkp_inv_sub_type_id: 3723`

### Step 13: Create CHA Inventory
**Purpose**: Configure Cargo Handling Agent inventory.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/inventory/cha`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "hub_config_id": "<configId>",
    "lkp_inv_type_id": 3755,
    "is_inv_exists": true,
    "no_cargo_handler": 2,
    "lkp_draft_active": "save_next"
  }
  ```
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: `lkp_inv_type_id: 3755` (CHA)

### Step 14: Create General Configuration
**Purpose**: Configure general operational settings.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/operations/general-config`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Large payload with various operational flags and dates
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Various hardcoded operational settings

### Step 15: Update Stock Take Operational Configuration
**Purpose**: Configure stock take operations.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/operations/stock-take`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Stock take configuration with recurrence and frequency settings
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Lookup IDs for recurrence, service type, frequency

### Step 16: Update Roles Operational Configuration
**Purpose**: Assign roles to the hub configuration.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/operations/roles`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "hubConfigId": "<configId>",
    "roleId": [390, 11, 159],
    "lookupDraftActive": "SAVE_NEXT",
    "status": true
  }
  ```
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Hardcoded role IDs

### Step 17: Update Cross-Docking Operational Configuration
**Purpose**: Configure cross-docking operations.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/operations/cross-docking`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Cross-docking settings with date ranges
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Date ranges and operational master ID

### Step 18: Create Weighbridge Configuration
**Purpose**: Configure weighbridge equipment.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/weighbridge-configurations`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Weighbridge details with unique generated ID
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Generated `weighBridgeId` (W + 4 random digits), hardcoded placement and make IDs

### Step 19: Create Facilities Configuration
**Purpose**: Configure additional facilities.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/facilities-configuration`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Facility details with dates and remarks
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Facility type ID, dates

### Step 20: Create Process Configuration
**Purpose**: Configure process settings with all features enabled.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/process/basic-configs`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Complex payload with weighbridge reference, roster, mail room, virtual branch settings
- **Pre-data Required**: `configId` from Step 2, `weighBridgeId` from Step 18
- **Unique Values**: References weighbridge ID, various lookup IDs

### Step 21: Create CUT OFF & TAT Configuration
**Purpose**: Configure cut-off times and turnaround times.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/process/cutoff-thresholds`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Time configurations for various operations
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Time strings and lookup IDs

### Step 22: Create Vehicle Condition Check Configuration
**Purpose**: Configure vehicle condition checks.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/process/vehicle-conditions`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**:
  ```json
  {
    "hubConfigId": "<configId>",
    "checkRequired": {
      "isTransVehicleCheckReq": true,
      "isDeliveryVehicleCheckReq": true,
      "isBookingVehicleCheckReq": true
    },
    "lkpDraftActive": "SUBMIT"
  }
  ```
- **Pre-data Required**: `configId` from Step 2
- **Unique Values**: Draft status changes to "SUBMIT" (final step)

### Step 23: Submit Test Version (Final Confirmation)
**Purpose**: Final submission of the hub configuration.

**API Details**:
- **Method**: POST
- **Endpoint**: `${baseUrl}/${configId}/testVersion`
- **Headers**: Standard auth headers + `Content-Type: application/json`
- **Body**: Complex headers payload (seems to be a framework-specific structure)
- **Pre-data Required**: `configId` from Step 2
- **Response**: Final confirmation message
- **Unique Values**: Framework-specific header structure

## Data Flow and Dependencies

1. **Authentication**: Consistent across all calls
2. **Config ID**: Generated in Step 2, used in all subsequent calls
3. **Branch Data**: From Step 1, used in Step 2
4. **Lookup Data**: From Step 7, used in Steps 8-9
5. **Weighbridge ID**: Generated in Step 18, used in Step 20
6. **Draft Status**: Progresses from SAVE_NEXT to SUBMIT in final step

## Key Patterns and Best Practices Demonstrated

- **Sequential API Calls**: Each step builds on previous data
- **Dynamic Data**: Lookup values fetched and randomly selected
- **Unique ID Generation**: For weighbridges and other entities
- **Multipart Uploads**: For file attachments in layout config
- **Error Handling**: Status code validation and response checking
- **Data Transformation**: Nullifying IDs for creation payloads

## Testing Considerations

- All steps expect 201 Created status for successful operations
- Response validation includes status codes, messages, and data structure checks
- The workflow creates a complete, testable hub configuration
- Can be used as a template for other hub configuration scenarios

This documentation covers the complete workflow, data requirements, and API interactions present in the test script.