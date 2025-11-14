const { request } = require('@playwright/test');

class ApiClient {
  constructor(baseUrl, token, userId) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.context = null;
        this.userId = userId;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
            'userid': this.userId
    };
  }

  async get(path, queryParams) {
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

  async post(path, body) {
    const context = await request.newContext();
    return context.post(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async put(path, body) {
    const context = await request.newContext();
    return context.put(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async patch(path, body) {
    const context = await request.newContext();
    return context.patch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
  }

  async delete(path) {
    const context = await request.newContext();
    return context.delete(`${this.baseUrl}${path}`, {
      headers: this.getHeaders()
    });
  }
}

module.exports = { ApiClient };
