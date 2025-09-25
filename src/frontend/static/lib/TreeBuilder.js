import { l, i, o } from './lio.js';

export default class TreeBuilder {
   constructor(map) {
      this.map = map ? map : {};
      this.root = null;
   }
   // can use different trees with same map (Custom Ui)
   createTree(tree) {
      this.root = {
         value: 'root',
         dom: null,
         childrens: {},
      };

      this.addChildrens(this.root, tree);

      return this.root;
   }

   addChildrens(parent, configChildrens) {
      for (let c in configChildrens) {
         if (!this.map[c]) {
            throw new Error(`The UiBuilder cannot find the component "${c}" in the map.`);
         }

         const config_grand_childrens = configChildrens[c];
         if (!parent.childrens) {
            parent.childrens = {};
         }
         parent.childrens[c] = {
            childrens: null,
            dom: null,
         };

         this.addChildrens(parent.childrens[c], config_grand_childrens);
         //this.addElements(child, parentDom);
      }
   }
}
