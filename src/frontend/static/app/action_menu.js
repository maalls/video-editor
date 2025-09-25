export default class ActionMenu {
   constructor(uiBuilder) {
      this.uiBuilder = uiBuilder;
   }
   create() {
      const div = document.createElement('div');
      div.className = 'row align-items-center p-2 bg-dark';
      div.innerHTML = `<div class="col-md-3  text-end">
                  <div>
                     <i class="fas fa-add"></i>
                     <i class="fas fa-share-nodes"></i>
                     <i class="fas fa-cog"></i>
                  </div>
               </div>`;

      return div;
   }
}
