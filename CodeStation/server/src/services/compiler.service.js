const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Fetches all supported compilers from OnlineCompiler.io
 */
const fetchCompilers = async () => {
  logger.info("Fetching compilers from OnlineCompiler.io");
  const response = await fetch(`${env.COMPILER_API_BASE}/api/compilers/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch language list: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Executes code synchronously on OnlineCompiler.io
 * @param {string} compiler
 * @param {string} code
 * @param {string} input
 */
const runCodeSync = async (compiler, code, input = "") => {
  logger.info(`Sending code run request to OnlineCompiler.io for compiler: ${compiler}`);
  
  const response = await fetch(`${env.COMPILER_API_BASE}/api/run-code-sync/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.COMPILER_API_KEY,
    },
    body: JSON.stringify({ compiler, code, input }),
  });

  return response;
};

module.exports = {
  fetchCompilers,
  runCodeSync
};
