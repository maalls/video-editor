export default class UiBuilder {
   constructor() {
      this.container = null;
   }

   async addApp(app) {
      this.createTree(app.tree);
   }

   createTree(tree) {
      this.container = this.createTag('div', 'root', 'main-container', 'container-fluid');
      document.body.append(this.container);
      const root = document.createElement('div');
   }

   addElements({ element, childrens }, parentDom) {
      element = element || this.createTag('div', crypto.randomUUID());
      parentDom = parentDom ? parentDom : document.body;
      //console.log('append', element, 'to', parentDom);
      parentDom.append(element);

      if (!childrens) {
         return;
      }

      for (const key in childrens) {
         const child = childrens[key];
         this.addElements(child, element);
      }
   }

   div(htmlContent = '', className = '') {
      const element = this.createTag('div');
      element.innerHTML = htmlContent;
      if (className) element.className = className;

      return element;
   }

   createTag(tagName, id, className = '') {
      const element = document.createElement(tagName);
      if (!id)
         throw new Error('The Tree element requires an ID.', {
            cause: new Error('Missing ID'),
            tagName,
            className,
         });
      element.id = id;
      if (className) element.className = className;
      return element;
   }

   createBootstrapAlert(type, title, message) {
      const alert = this.createTag('div', 'main-alert');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
      `;
      return alert;
   }
}
