export default class Header {
   constructor(uiBuilder) {
      this.uiBuilder = uiBuilder;
      this.dom = null;
      this.childrens = [];
      this.projects = null;
   }

   addProjects(projects) {
      this.projects = projects;
      this.add(projects);
   }
   /* 
   TODO: Investigate how this pattern could help the Tree builder 
   for automating the creation of the relationships between entities.
   */
   add(child) {
      this.childrens.push(child);
      child.setParent(this.dom);
   }

   async init({ projects }) {

      console.log("[header] init with projects", projects);
      this.dom = document.createElement('header');
      this.dom.className = 'bg-primary text-white';
      const req = await fetch('/static/header.html');
      this.dom.innerHTML = await req.text();
      console.log("[header] init done, returning", this.dom.innerHTML.length);

      this.dom.querySelector('#projects-container').append(projects.dom);
      return this.dom;
      /*
      this.addMenu();

      this.dom.querySelector('#projects-container').append(this.projects.select);
      return this.dom;
      */
   }

   addMenu() {
      this.dom
         .querySelector('#menus')
         .insertAdjacentHTML(
            'beforeend',
            '<li><a href="#" class="nav-link px-2 text-secondary">Home</a></li>'
         );
   }
}
