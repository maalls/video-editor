// @ts-nocheck
/* eslint-disable */
// Disable autocomplete and IntelliSense for this file

export default class UiBuilder {
   constructor(element = null, childrens = null) {
      this.element = this.contextualize(element, childrens);
   }

   createElement(element, children) {
      return this.contextualize(element, children);
   }
   contextualize(element = null, children = {}) {
      return {
         element: element,
         childrens: children,
      };
   }

   import(filePath) {
      return 'hello';
   }
}
