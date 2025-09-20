export default class UiBuilder {
   constructor() {
      this.container = this.createTag('div', null, 'container-fluid');
      document.body.append(this.container);
      this.context = [this.container];
   }

   appendTag(tagName, textContent, className = '') {
      const element = this.createTag(tagName);
      element.textContent = textContent;
      if (className) element.className = className;
      this.container.append(element);
      return element;
   }

   div(htmlContent = '', className = '') {
      const element = this.createTag('div');
      element.innerHTML = htmlContent;
      if (className) element.className = className;

      return element;
   }

   createTag(tagName, htmlContent = null, className = '') {
      const element = document.createElement(tagName);
      element.innerHTML = htmlContent;
      if (className) element.className = className;
      return element;
   }

   createBootstrapAlert(type, title, message) {
      const alert = this.createTag('div');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
      `;
      return alert;
   }
}
