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

  const files = fs.readdirSync(docsDir).filter(file => file.endsWith('.txt') && file !== 'COMMON_HEADERS.txt' && file !== 'AI_TEST_GENERATION_PROMPT.txt'); 
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

// Load common headers documentation
function loadCommonHeaders() {
  const commonHeadersFile = path.join(__dirname, '..', 'docs', 'COMMON_HEADERS.txt');
  if (!fs.existsSync(commonHeadersFile)) {
    console.warn('COMMON_HEADERS.txt not found. Header instructions will not be included.');
    return '';
  }
  return fs.readFileSync(commonHeadersFile, 'utf8');
}

// Load AI prompt template
function loadPromptTemplate() {
  const promptFile = path.join(__dirname, '..', 'docs', 'AI_TEST_GENERATION_PROMPT.txt');
  if (!fs.existsSync(promptFile)) {
    console.warn('AI_TEST_GENERATION_PROMPT.txt not found. Using default prompt.');
    return '';
  }
  return fs.readFileSync(promptFile, 'utf8');
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
  console.log('Loading common headers documentation...');
  const commonHeaders = loadCommonHeaders();
  console.log('Loading AI prompt template...');
  const promptTemplate = loadPromptTemplate();

  // Ensure generated-tests directory exists
  const generatedTestsDir = path.join(__dirname, '..', 'generated-tests');
  if (!fs.existsSync(generatedTestsDir)) {
    fs.mkdirSync(generatedTestsDir, { recursive: true });
  }

  console.log('\nGenerating tests...');

  for (const spec of apiSpecs) {
    const specName = spec.name.replace('.txt', '');
    const chain = apiChain[specName] || {};
    
    console.log(`\n  Processing: ${spec.name}`);

    // Construct prompt for LLM
    const prompt = `
${promptTemplate}

API SPECIFICATION:
${spec.contents}

CHAINING REQUIREMENTS:
${JSON.stringify(chain, null, 2)}

COMMON HEADERS (MANDATORY FOR ALL REQUESTS):
${commonHeaders}
`;

    try {
      console.log('   Calling LLM...');
      const response = await promptLLM(prompt);
      const generatedCode = response.data.choices[0].message.content;
      
      // Clean up the generated code (remove markdown code blocks if present)
      let cleanCode = generatedCode;
      if (cleanCode.includes('```')) {
        // Remove all markdown code blocks
        cleanCode = cleanCode.replace(/```(?:javascript|js)?\n?/gi, '').replace(/```\n?/g, '');
      }

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
