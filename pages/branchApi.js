const { ApiClient } = require('../utils/apiClient');

/**
 * Branch API Page Object
 * Handles all Branch API endpoints as documented in docs/branch.txt
 */
class BranchApi {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.basePath = '/v1/hub/configurations/branches';
  }

  /**
   * Get all branches
   * @returns Promise - Array of branch objects
   */
  async getAllBranches() {
    return this.apiClient.get(this.basePath);
  }

  /**
   * Get branch by ID
   * @param {string} branchId - Branch identifier
   * @returns Promise - Single branch object
   */
  async getBranchById(branchId) {
    return this.apiClient.get(`${this.basePath}/${branchId}`);
  }

  /**
   * Search branches by name
   * @param {string} branchName - Branch name to search
   * @returns Promise - Array of matching branches
   */
  async searchBranchesByName(branchName) {
    return this.apiClient.get(`${this.basePath}/search/${branchName}`);
  }

  /**
   * Create new branch
   * @param {Object} branchData - Branch data
   * @param {string} branchData.branchName - Branch name
   * @param {string} branchData.branchCode - Branch code
   * @param {string} branchData.status - Branch status
   * @returns Promise - Created branch with branchId
   */
  async createBranch(branchData) {
    return this.apiClient.post(this.basePath, branchData);
  }

  /**
   * Update branch details
   * @param {string} branchId - Branch identifier
   * @param {Object} updateData - Partial branch data to update
   * @returns Promise - Updated branch object
   */
  async updateBranch(branchId, updateData) {
    return this.apiClient.put(`${this.basePath}/${branchId}`, updateData);
  }

  /**
   * Delete branch
   * @param {string} branchId - Branch identifier
   * @returns Promise - Success message
   */
  async deleteBranch(branchId) {
    return this.apiClient.delete(`${this.basePath}/${branchId}`);
  }

  /**
   * Get pincode to branch mappings
   * @returns Promise - Array of pincode mappings
   */
  async getPincodeMappings() {
    return this.apiClient.get(`${this.basePath}/pincode-mapping`);
  }

  /**
   * Create pincode to branch mapping
   * @param {Object} mappingData - Pincode mapping data
   * @param {string} mappingData.pincode - Pincode
   * @param {string} mappingData.branchId - Branch ID
   * @returns Promise - Created mapping
   */
  async createPincodeMapping(mappingData) {
    return this.apiClient.post(`${this.basePath}/pincode-mapping`, mappingData);
  }

  /**
   * Get master slabs configuration
   * @returns Promise - Array of slab configurations
   */
  async getMasterSlabs() {
    return this.apiClient.get(`${this.basePath}/master-slabs`);
  }

  /**
   * Get all branch types
   * @returns Promise - Array of branch type definitions
   */
  async getBranchTypes() {
    return this.apiClient.get(`${this.basePath}/types`);
  }

  /**
   * Helper method to extract branchId from response
   * @param {Object} response - API response
   * @returns {Promise<string>} - Extracted branchId
   */
  async extractBranchId(response) {
    const data = await response.json();
    return data.branchId || data.id || data._id;
  }
}

module.exports = { BranchApi };
