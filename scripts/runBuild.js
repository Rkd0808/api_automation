const fs = require('fs');
const path = require('path');
const { promptLLM } = require('../utils/openRouterClient');

// Load all API specs from the docs folder
function loadAPISpecs() {
  const docsDir = path.join(__dirname, '..', 'docs');
  
  if (!fs.existsSync(docsDir)) {
    console.error('docs/ folder not found. Creating it...');
    fs.mkdirSync(docsDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.txt'));
  
  return files.map(file => ({
    name: file,
    contents: fs.readFileSync(path.join(docsDir, file), 'utf8')
  }));
}

// Load API chaining configuration
function loadAPIChain() {
  const chainFile = path.join(__dirname, '..', 'chains', 'api_chain.json');
  
  if (!fs.existsSync(chainFile)) {
    console.warn('api_chain.json not found. No chaining will be applied.');
    return {};
  }

  return JSON.parse(fs.readFileSync(chainFile, 'utf8'));
}

// Generate test cases using LLM
async function generateTests() {
  console.log('Loading API specifications...');
  const apiSpecs = loadAPISpecs();
  
  if (apiSpecs.length === 0) {
    console.log('No API specs found in docs/ folder. Please add API specifications.');
    return;
  }

  console.log(`Found ${apiSpecs.length} API specification(s)`);
  console.log('Loading chaining configuration...');
  const apiChain = loadAPIChain();

  // Ensure generated-tests directory exists
  const generatedTestsDir = path.join(__dirname, '..', 'generated-tests');
  if (!fs.existsSync(generatedTestsDir)) {
    fs.mkdirSync(generatedTestsDir, { recursive: true });
  }

  console.log('\nGenerating tests...');

  for (const spec of apiSpecs) {
    const specName = spec.name.replace('.txt', '');
    const chain = apiChain[specName] || {};

    console.log(`\n Processing: ${spec.name}`);

    // Construct prompt for LLM
    const prompt = `
You are an expert API test automation engineer. Given the following API specification and chaining requirements, generate comprehensive Playwright test cases.

API SPECIFICATION:
${spec.contents}

CHAINING REQUIREMENTS:
${JSON.stringify(chain, null, 2)}

PLEASE GENERATE:
1. Playwright test cases using @playwright/test
2. Achieve at least 80% endpoint coverage (positive, negative, and edge cases)
3. Extract response fields as specified in chaining requirements
4. Use extracted fields as payloads for subsequent API calls
5. Use BDD-style test descriptions
6. Include proper assertions
7. Handle errors appropriately
8. Use CommonJS require: const { ApiClient } = require('../utils/apiClient');
9. Use environment variables for BASE_URL and JWT_TOKEN
IMPORTANT: Provide ONLY pure JavaScript code with CommonJS syntax (require/module.exports). DO NOT wrap code in markdown blocks or backticks. Start directly with code.`;

    try {
      console.log('   Calling LLM...');
      const response = await promptLLM(prompt);
      const generatedCode = response.data.choices[0].message.content;

      // Clean up the generated code (remove markdown code blocks if present)
      let cleanCode = generatedCode;
    if (cleanCode.includes('```')) {
      // Remove all markdown code blocks
      cleanCode = cleanCode.replace(/```(?:javascript|js)?\n?/gi, '').replace(/```\n?/g, '');
    }      }

      // Save the generated test file
      const testFileName = `${specName}.spec.js`;
      const testFilePath = path.join(generatedTestsDir, testFileName);
      fs.writeFileSync(testFilePath, cleanCode);

      console.log(`   ✓ Generated: ${testFileName}`);
    } catch (error) {
      console.error(`   ✗ Error generating tests for ${spec.name}:`, error.message);
    }
  }

  console.log('\nTest generation complete!');
  console.log(`Generated tests saved to: ${generatedTestsDir}`);
}

// Run the generator
generateTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
