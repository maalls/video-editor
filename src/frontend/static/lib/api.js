class Api {
   constructor(baseUrl) {
      this.baseUrl = baseUrl ? baseUrl : 'http://localhost:3000';
   }

   async get(endpoint) {
      const uri = `${this.baseUrl}${endpoint}`;
      const response = await fetch(uri, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      return response.json();
   }
}

const api = new Api('http://localhost:3000');
export default api;
