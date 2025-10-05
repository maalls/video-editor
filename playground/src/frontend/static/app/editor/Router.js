export default class Router {
   constructor(dom) {
      this.dom = dom;

      dom.addEventListener('click', e => {
         console.log('click', e);
      });

      dom.addEventListener('project_selected', e => {
         //const target = e.target.closest('[data-route]');
         console.log('project_selected', e);
      });
   }
}
