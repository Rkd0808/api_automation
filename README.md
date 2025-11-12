# Hub Configuration Service API - Playwright Automation Framework

## Overview
This is an intelligent Playwright API automation framework for the Hub Configuration Service API. It features:
- **Auto-generated test cases** using LLM (NVIDIA Nemotron Nano 9B v2 via OpenRouter)
- **API chaining** - automatically extracts response data and uses it in subsequent requests
- **Page Object Model (POM)** design for maintainability
- **BDD-style tests** with comprehensive coverage
- **Modular architecture** for scalability

## Project Structure
```
api_automation/
├── docs/                    # API specifications (text format)
├── chains/                  # API chaining logic
│   └── api_chain.json
├── generated-tests/         # Auto-generated Playwright tests
├── pages/                   # Page Object Model for API endpoints
│   ├── branchApi.ts
│   ├── hcmOperationsApi.ts
│   ├── processConfigApi.ts
│   ├── inventoryApi.ts
│   └── ...
├── utils/                   # Utility functions
│   ├── apiClient.ts        # Reusable HTTP client
│   ├── auth.ts             # Authentication helper
│   ├── openRouterClient.js # LLM integration
│   ├── fileLoader.js
│   └── testWriter.js
├── scripts/
│   └── runBuild.js         # Test generation script
├── playwright.config.ts     # Playwright configuration
├── package.json
├── .env.example            # Environment variables template
└── .gitignore
```

## Features

### 1. Intelligent Test Generation
- Reads API specifications from `docs/` folder
- Uses LLM to auto-generate comprehensive test cases
- Achieves 80%+ coverage automatically
- Handles positive, negative, and edge cases

### 2. API Chaining
- Defines dependencies between APIs in `api_chain.json`
- Automatically extracts fields from responses
- Injects extracted data into subsequent API calls
- Supports complex workflows

### 3. Page Object Model
- Clean separation of concerns
- Reusable API endpoint wrappers
- Easy to maintain and extend

### 4. Bearer Token Authentication
- Centralized JWT token management
- Automatic header injection
- Supports multiple environments

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenRouter API key (for test generation)

## Installation

```bash
# Clone the repository
git clone https://github.com/Rkd0808/api_automation.git
cd api_automation

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env with your credentials
# - BASE_URL: Your API base URL
# - JWT_TOKEN: Your authentication token
# - OPENROUTER_API_KEY: Your OpenRouter API key
```

## Configuration

### Environment Variables (.env)
```env
BASE_URL=https://your-api-url.com
JWT_TOKEN=your-jwt-token-here
OPENROUTER_API_KEY=your-openrouter-key-here
```

### API Chaining (chains/api_chain.json)
```json
{
  "branch": {
    "next": "hcm_operations",
    "extract": ["branchId"],
    "inject_into": "hcm_operations.branchId"
  },
  "hcm_operations": {
    "next": "inventory",
    "extract": ["operationId"],
    "inject_into": "inventory.operationId"
  }
}
```

## Usage

### Generate Tests
Run the build script to auto-generate test cases from API specs:

```bash
node scripts/runBuild.js
```

This will:
1. Read all API specs from `docs/` folder
2. Parse the chaining logic from `api_chain.json`
3. Send specs to LLM for test generation
4. Save generated tests to `generated-tests/` folder

### Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- branch.spec.ts

# Run tests in headed mode
npm test -- --headed

# Run tests with UI mode
npm test -- --ui
```

### View Reports
```bash
# Open HTML report
npm run report
```

## API Coverage

The framework supports the following API categories:

| API Category | Endpoints Covered |
|--------------|------------------|
| Branch API | Get all, get by ID, search, pincode mapping, master slabs, branch types |
| HCM Operations | Stock transfer/take, roles, general config, cross-docking (CRUD) |
| HCM Process Config | Vehicle conditions, cut-off thresholds, basic configs (CRUD) |
| Hub Features | Weighbridge, facilities (CRUD) |
| Inventory Management | Unitization, MHE, electronic devices, CHA (CRUD & bulk check) |
| Hub Landing & Layout | Basic configs, version data, gates, buildings, bays, offices (CRUD) |
| Lookup API | Load roles/lookup data |

## Adding New APIs

1. **Create API Spec**: Add a new text file in `docs/` describing the API
   ```
   docs/new_endpoint.txt
   ```

2. **Define Chaining** (optional): Update `chains/api_chain.json` if the API depends on others

3. **Generate Tests**: Run `node scripts/runBuild.js`

4. **Review & Customize**: Check generated tests in `generated-tests/`

## Example Test

```typescript
import { test, expect } from '@playwright/test';
import { ApiClient } from '../utils/apiClient';
import { BranchApi } from '../pages/branchApi';

test.describe('Branch API', () => {
  test('should fetch all branches', async () => {
    const client = new ApiClient(
      process.env.BASE_URL!,
      process.env.JWT_TOKEN!
    );
    const branchApi = new BranchApi(client);
    
    const response = await branchApi.getAllBranches();
    expect(response.ok()).toBeTruthy();
    
    const branches = await response.json();
    expect(Array.isArray(branches)).toBeTruthy();
    expect(branches.length).toBeGreaterThan(0);
  });
});
```

## Architecture Highlights

### ApiClient (utils/apiClient.ts)
- Centralized HTTP request handling
- Automatic Bearer token injection
- Support for GET, POST, PUT, DELETE methods
- Error handling and retry logic

### Page Objects (pages/*.ts)
- Each API category has its own page object
- Methods represent individual endpoints
- Clean, testable interface

### Test Generation (scripts/runBuild.js)
- Reads API specs and chaining logic
- Constructs prompts for LLM
- Generates BDD-style Playwright tests
- Ensures 80%+ coverage

## Best Practices

1. **Keep API Specs Updated**: Always update `docs/` when APIs change
2. **Review Generated Tests**: Always review LLM-generated tests before running
3. **Use Chaining Wisely**: Only chain APIs with real dependencies
4. **Secure Tokens**: Never commit `.env` file with real credentials
5. **Run Tests in CI/CD**: Integrate with your pipeline for continuous testing

## Troubleshooting

### Tests Failing
- Check if `BASE_URL` and `JWT_TOKEN` are correct in `.env`
- Verify API is accessible from your network
- Check if token has expired

### Generation Issues
- Verify `OPENROUTER_API_KEY` is valid
- Check API specs format in `docs/` folder
- Review `api_chain.json` syntax

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## References

- [Playwright Documentation](https://playwright.dev/)
- [OpenRouter API](https://openrouter.ai/)
- [NVIDIA Nemotron](https://build.nvidia.com/)
