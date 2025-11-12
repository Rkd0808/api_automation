const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

/**
 * Send a prompt to the LLM and get a response
 * @param {string} textSpec - The prompt text to send to the LLM
 * @returns {Promise} - The LLM response
 */
async function promptLLM(textSpec) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: textSpec
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Rkd0808/api_automation',
          'X-Title': 'API Automation Framework'
        }
      }
    );

    return response;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

module.exports = { promptLLM };
