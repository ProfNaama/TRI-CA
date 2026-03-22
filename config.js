let config = {}
const crypto = require('crypto');
// exp id:
config.experimentId = process.env['EXPERIMENT_ID'];

// complete code
config.complete_code = process.env['COMPLETE_CODE'];
config.redirect_url = process.env['REDIRECT_URL'];

// openai
config.apiKey = process.env['OPENAI_API_KEY'];
config.apiTokenLimit = parseInt(process.env["OPENAI_TOKEN_LIMIT"] || "1000");
config.apiModel = process.env['OPENAI_MODEL'] || "gpt-4o";

// a fake response for testing
config.fakeLlmResponse = process.env['FAKE_LLM_RESPONSE'] || "This is a fake TRI-CA response for local testing.";

// postgres
config.connectionString = process.env['DATABASE_URL'];
config.resultsTable = process.env['RESULTS_PGTABLE'] || "tri_ca_results";
config.codesTable = process.env['CODES_PGTABLE'] || "tri_ca_codes";


// save results
config.resultsFile = process.env['RESULTS_FILE'];
config.encodeBase64 = process.env['BASE64_ENCODE'] && parseInt(process.env['BASE64_ENCODE']) != 0;
config.sessionSecret = process.env['SESSION_SECRET'] || crypto.randomBytes(32).toString('hex');

// secret code ... temporary
config.reusableCode = process.env['REUSABLE_CODE'];
module.exports = config;
