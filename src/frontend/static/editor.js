export default class Editor {
   
   constructor() {
      this.dom = null;
   }

   async init() {

      this.dom = document.createElement('div');
      this.dom.className = 'editor';
      this.dom.style.width = '100%';
      this.dom.style.height = '100%';
      this.dom.innerHTML = "TODO: Editor";

      console.log("listening for project_selected event");
      document.addEventListener("project_selected", (event) => {
         console.log("event received", event.detail);
         const slug = event.detail.slug; // ✅ Access the nested project object
         console.log("[editor] project selected", slug);
         this.dom.innerHTML = `Editor for project: ${slug}`;
      });

      return this.dom;
   }
}
