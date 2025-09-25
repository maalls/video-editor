class Template {
   constructor() {
      this.parser = new DOMParser();
   }

   async dom(path) {
      const html = await this.fetch(path);
      const template = document.createElement('template');
      template.innerHTML = html.trim();

      const children = template.content.children;

      if (children.length === 1) {
         return children[0]; // Single element
      } else if (children.length > 1) {
         return template.content.cloneNode(true); // DocumentFragment for multiple
      } else {
         return null; // No elements
      }
   }

   async fetch(path) {
      const req = await fetch(`static/app/${path}.html`);
      return await req.text();
   }
}
const template = new Template();
export default template;
