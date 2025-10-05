import template from './../lib/Template.js';

export default class Logo {
   constructor() {
      this.dom = null;
   }

   async init() {
      this.dom = await template.dom('logo');
      return this.dom;
   }
}
