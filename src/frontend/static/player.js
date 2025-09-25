export default class Player {
   constructor() {
      this.dom = null;
   }

   async init() {
      this.dom = document.createElement('div');
      this.dom.className = 'player';
      this.dom.style.width = '100%';
      this.dom.style.height = '100%';
      this.dom.innerHTML = 'TODO: Player';

      return this.dom;
   }
}
