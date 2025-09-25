import DomBuilder from './DomBuilder.js';
import TreeBuilder from './TreeBuilder.js';

class Helper {
   static createTag(tagName, id, className = '') {
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
}

export default class UiBuilder {
   constructor() {
      this.root = null;
   }

   async addApp(app) {
      this.tree = new TreeBuilder(app.map);
      // layout
      this.tree.createTree(app.tree);
      this.dom = new DomBuilder(app.map);
      // renderer
      await this.dom.createDom(this.tree);
      //this.init(this.root.dom, this.root.childrens);
   }

   /*addElements({ element, childrens }, parentDom) {
      element = element || Helper.createTag('div', crypto.randomUUID());
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
   }*/

   div(htmlContent = '', className = '') {
      const element = Helper.createTag('div');
      element.innerHTML = htmlContent;
      if (className) element.className = className;

      return element;
   }
   createBootstrapAlert(type, title, message) {
      const alert = Helper.createTag('div', 'main-alert');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
         <h4 class="alert-heading">${title}</h4>
         <p>${message}</p>
      `;
      return alert;
   }
}
