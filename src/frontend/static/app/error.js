export class ErrorView {
   create(error) {
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger';
      errorAlert.innerHTML = `
            <h4 class="alert-heading">Connection Error!</h4>
            <p><strong>Error:</strong> ${error.message}</p>
            <hr>
            <p class="mb-0">Make sure your server is running on <code>http://localhost:3000</code></p>
         `;
      return errorAlert;
   }

   showError(title, message) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger alert-dismissible fade show';
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
         <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;

      // Insert at the top of the container
      const container = this.uiBuilder.container;
      container.insertBefore(alert, container.firstChild);
   }

   showSuccess(title, message) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show';
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
         <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;

      // Insert at the top of the container
      const container = this.uiBuilder.container;
      container.insertBefore(alert, container.firstChild);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
         if (alert.parentElement) {
            alert.remove();
         }
      }, 5000);
   }
}
