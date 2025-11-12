import { request, APIRequestContext } from '@playwright/test';

export class ApiClient {
  private baseUrl: string;
  private token: string;
  private context: APIRequestContext | null = null;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async get(path: string, queryParams?: Record<string, any>) {
    const context = await request.newContext();
    let url = `${this.baseUrl}${path}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    return context.get(url, {
      headers: this.getHeaders()
    });
  }

  async post(path: string, body: any) {
    const context = await request.newContext();
    return context.post(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async put(path: string, body: any) {
    const context = await request.newContext();
    return context.put(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async patch(path: string, body: any) {
    const context = await request.newContext();
    return context.patch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async delete(path: string) {
    const context = await request.newContext();
    return context.delete(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
    });
  }
}
