export default class Header {
   constructor(uiBuilder) {
      this.uiBuilder = uiBuilder;
      this.header = null;
      this.childrens = [];
      this.projects = null;
   }

   async init() {
      this.create();
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
      child.setParent(this.header);
   }

   async create() {
      this.header = document.createElement('header');
      this.header.className = 'bg-primary text-white';
      const req = await fetch('/static/header.html');
      this.header.innerHTML = await req.text();
      console.log('header size', this.header.innerHTML.length);
      this.addMenu();

      this.header.querySelector('#projects-container').append(this.projects.select);
      return this.header;
   }

   addMenu() {
      this.header
         .querySelector('#menus')
         .insertAdjacentHTML(
            'beforeend',
            '<li><a href="#" class="nav-link px-2 text-secondary">Home</a></li>'
         );
   }
}
