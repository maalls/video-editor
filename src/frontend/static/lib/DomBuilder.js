export default class DomBuilder {
   constructor(map) {
      this.map = map ? map : {};
   }

   async createDom(tree) {
      tree.root.dom = document.body;

      await this.initRoot(tree);
      await this.startRoot(tree);
   }

   async initRoot(tree) {
      console.log('tree root childrens', tree);
      const childrens = await this.initChildrens(tree.root.childrens);
      console.log('root childrens', childrens);
      for (const key in childrens) {
         tree.root.dom.append(childrens[key].dom);
      }
   }

   async initChildrens(childrens) {
      console.log('init childrens', childrens);
      for (const key in childrens) {
         const child = childrens[key];

         if (!this.map[key]) {
            throw new Error(`The UiBuilder cannot find the component "${key}" in the map.`);
         }

         await this.initChildrens(child.childrens);

         console.log('fetch');

         const childDom = await this.map[key].init(child.childrens);

         childrens[key].dom = childDom;
         //root.dom.append(dom);
      }
      return childrens;
   }

   async startRoot(tree) {
      this.startChildrens(tree.root.childrens);
   }

   async startChildrens(childrens) {
      for (const key in childrens) {
         const child = childrens[key];

         await this.startChildrens(child.childrens);

         if (typeof this.map[key]?.start === 'function') {
            console.log('starting ', key, this.map[key]);
            this.map[key]?.start(child.dom);
         }
      }
   }
}
