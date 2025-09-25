import { l, i, o } from './lio.js';

export default class DomBuilder {
   constructor(map) {
      this.map = map ? map : {};
   }

   async createDom(tree) {
      l('Creating the DOM for', tree.root);
      tree.root.dom = document.body;
      await this.initRoot(tree);
      await this.startRoot(tree);
   }

   async initRoot(tree) {
      const childrens = await this.initChildrens(tree.root.childrens);
      for (const key in childrens) {
         tree.root.dom.append(childrens[key].dom);
      }
   }

   async startRoot(tree) {
      this.startChildrens(tree.root.childrens);
   }

   async startChildrens(childrens) {
      for (const key in childrens) {
         const child = childrens[key];
         console.log('start childrens of ', key);
         await this.startChildrens(child.childrens);

         if (typeof this.map[key]?.start === 'function') {
            console.log('starting ', key, this.map[key]);
            this.map[key]?.start(child.dom);
         }
      }
   }

   async start(element) {
      //const el = this.map[]
   }

   async initChildrens(childrens) {
      console.log('childrens', childrens);
      //console.log("init childrens", root.childrens);
      for (const key in childrens) {
         const child = childrens[key];

         if (!this.map[key]) {
            throw new Error(`The UiBuilder cannot find the component "${key}" in the map.`);
         }

         await this.initChildrens(child.childrens);
         const childDom = await this.map[key].init(child.childrens);

         childrens[key].dom = childDom;
         //root.dom.append(dom);
      }
      return childrens;
   }
}
