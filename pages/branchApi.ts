import { ApiClient } from '../utils/apiClient';
import { APIResponse } from '@playwright/test';

/**
 * Branch API Page Object
 * Handles all Branch API endpoints as documented in docs/branch.txt
 */
export class BranchApi {
  private apiClient: ApiClient;
  private basePath = '/v1/hub/configurations/branches';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get all branches
   * @returns Promise<APIResponse> - Array of branch objects
   */
  async getAllBranches(): Promise<APIResponse> {
    return this.apiClient.get(this.basePath);
  }

  /**
   * Get branch by ID
   * @param branchId - Branch identifier
   * @returns Promise<APIResponse> - Single branch object
   */
  async getBranchById(branchId: string): Promise<APIResponse> {
    return this.apiClient.get(`${this.basePath}/${branchId}`);
  }

  /**
   * Search branches by name
   * @param branchName - Branch name to search
   * @returns Promise<APIResponse> - Array of matching branches
   */
  async searchBranchesByName(branchName: string): Promise<APIResponse> {
    return this.apiClient.get(`${this.basePath}/search/${branchName}`);
  }

  /**
   * Create new branch
   * @param branchData - Branch data
   * @returns Promise<APIResponse> - Created branch with branchId
   */
  async createBranch(branchData: {
    branchName: string;
    branchCode: string;
    status: string;
  }): Promise<APIResponse> {
    return this.apiClient.post(this.basePath, branchData);
  }

  /**
   * Update branch details
   * @param branchId - Branch identifier
   * @param updateData - Partial branch data to update
   * @returns Promise<APIResponse> - Updated branch object
   */
  async updateBranch(
    branchId: string,
    updateData: Partial<{
      branchName: string;
      branchCode: string;
      status: string;
    }>
  ): Promise<APIResponse> {
    return this.apiClient.put(`${this.basePath}/${branchId}`, updateData);
  }

  /**
   * Delete branch
   * @param branchId - Branch identifier
   * @returns Promise<APIResponse> - Success message
   */
  async deleteBranch(branchId: string): Promise<APIResponse> {
    return this.apiClient.delete(`${this.basePath}/${branchId}`);
  }

  /**
   * Get pincode to branch mappings
   * @returns Promise<APIResponse> - Array of pincode mappings
   */
  async getPincodeMappings(): Promise<APIResponse> {
    return this.apiClient.get(`${this.basePath}/pincode-mapping`);
  }

  /**
   * Create pincode to branch mapping
   * @param mappingData - Pincode mapping data
   * @returns Promise<APIResponse> - Created mapping
   */
  async createPincodeMapping(mappingData: {
    pincode: string;
    branchId: string;
  }): Promise<APIResponse> {
    return this.apiClient.post(`${this.basePath}/pincode-mapping`, mappingData);
  }

  /**
   * Get master slabs configuration
   * @returns Promise<APIResponse> - Array of slab configurations
   */
  async getMasterSlabs(): Promise<APIResponse> {
    return this.apiClient.get(`${this.basePath}/master-slabs`);
  }

  /**
   * Get all branch types
   * @returns Promise<APIResponse> - Array of branch type definitions
   */
  async getBranchTypes(): Promise<APIResponse> {
    return this.apiClient.get(`${this.basePath}/types`);
  }

  /**
   * Helper method to extract branchId from response
   * @param response - API response
   * @returns string - Extracted branchId
   */
  async extractBranchId(response: APIResponse): Promise<string> {
    const data = await response.json();
    return data.branchId || data.id || data._id;
  }
}
