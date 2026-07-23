export const api = {
  isGAS: () => typeof window !== 'undefined' && window.google && window.google.script,

  async getDailyItems(dateString: string) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiGetDailyItems(dateString);
      });
    } else {
      const res = await fetch(`http://localhost:3000/api/items/daily?date=${dateString}`);
      return res.json();
    }
  },

  async saveDailyInput(payload: any) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiSaveDailyInput(payload);
      });
    } else {
      const res = await fetch('http://localhost:3000/api/items/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  async getDashboard() {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiGetDashboard();
      });
    } else {
      const res = await fetch('http://localhost:3000/api/dashboard');
      return res.json();
    }
  },

  async getRecap(month: string, year: string) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiGetRecap(month, year);
      });
    } else {
      const res = await fetch(`http://localhost:3000/api/recap?month=${month}&year=${year}`);
      return res.json();
    }
  },

  async saveImport(payload: any) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiSaveImport(payload);
      });
    } else {
      const res = await fetch('http://localhost:3000/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  async addProduct(payload: { code: string; spec: string; unit: string; saldoAwal: number }) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiAddProduct(payload);
      });
    } else {
      const res = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  async getProductReports(itemId: string | number) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiGetProductReports(itemId);
      });
    } else {
      const res = await fetch(`http://localhost:3000/api/reports/${itemId}`);
      return res.json();
    }
  },

  async addProductReport(payload: { itemId: string | number; po: string; tglPo: string; orderQty: number; pic: string; noGr?: string; keterangan: string }) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiAddProductReport(payload);
      });
    } else {
      const res = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  async updateProductReport(reportId: string | number, payload: any) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiUpdateProductReport(reportId, payload);
      });
    } else {
      const res = await fetch(`http://localhost:3000/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  async deleteProductReport(reportId: string | number) {
    if (this.isGAS()) {
      return new Promise((resolve) => {
        window.google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: err.message || err }))
          .apiDeleteProductReport(reportId);
      });
    } else {
      const res = await fetch(`http://localhost:3000/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      return res.json();
    }
  }
};

declare global {
  interface Window {
    google: any;
  }
}
