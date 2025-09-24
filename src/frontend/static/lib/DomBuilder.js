import {l, i, o} from './lio.js';

export default class DomBuilder {
    constructor(map) {
        this.map = map ? map : {};
    }

    async createDom(tree) {

        l("Creating the DOM for", tree.root);
        tree.root.dom = document.body;
        console.log("body", tree.root); 
        await this.initRoot(tree);
    }
    
    async initRoot(tree) {
        const childrens = await this.init(tree.root);
        console.log("tree built, attaching to root", childrens);
        for(const key in childrens) {
            console.log("attaching to root", key, childrens[key]);
            tree.root.dom.append(childrens[key].dom);
        }

    }

    async init(root) {
        //console.log("init childrens", root.childrens);
        const childrens = root.childrens;

            try {
            if (!childrens) {
                l(" -   no childrens");
                return;
            }

            
            for (const key in childrens) {
                console.log(key, childrens);
                const child = childrens[key];
                i(` - ${key}:`, child);

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
        catch (e) {
            console.error("DomBuilder error:", e);
            throw e;
        }


   }
}