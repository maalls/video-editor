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

         await this.startChildrens(child.childrens);

         if (typeof this.map[key]?.start === 'function') {
            this.map[key]?.start(child.dom);
         }
      }
   }

   async start(element) {
      //const el = this.map[]
   }

   async initChildrens(childrens) {
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
