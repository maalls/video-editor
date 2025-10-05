export default class Header {
   constructor(uiBuilder) {
      this.dom = null;
   }

   async init(fetch, { projects, logo }) {
      console.log('Header init', projects, logo);
      const header = document.createElement('header');
      header.className = 'bg-primary text-white';
      header.innerHTML = await fetch('header');
      header.querySelector('#projects-container').append(projects.dom);
      header.querySelector('#logo').append(logo.dom);
      return header;
      /*
      this.addMenu();

      this.dom.querySelector('#projects-container').append(this.projects.select);
      return this.dom;
      */
   }
}
