import {l, i, o} from './lio.js';

export default class DomBuilder {
    constructor(map) {
        this.map = map ? map : {};
    }

    async createDom(tree) {

        l("Creating the DOM for", tree.root);
        tree.root.dom = document.body;
        await this.initRoot(tree);
    }
    
    async initRoot(tree) {
        const childrens = await this.init(tree.root);
        for(const key in childrens) {
            tree.root.dom.append(childrens[key].dom);
        }

    }

    async init(root) {
        //console.log("init childrens", root.childrens);
        const childrens = root.childrens;
        for (const key in childrens) {
            const child = childrens[key];

            if(!this.map[key]) {
                throw new Error(`The UiBuilder cannot find the component "${key}" in the map.`);
            }
            
            await this.init(child);
            const childDom = await this.map[key].init(child.childrens);
            childrens[key].dom = childDom;
            //root.dom.append(dom);
        }
        return childrens;
   }
}