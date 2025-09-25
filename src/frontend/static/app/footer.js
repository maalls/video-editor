export default class Footer {
   constructor(uiBuilder) {
      this.uiBuilder = uiBuilder;
   }

   create() {
      const footer = this.uiBuilder.createTag('footer', 'footer');
      footer.className = 'bg-dark text-white py-2 mt-auto';
      footer.innerHTML = `
         <div class="container-fluid">
            <div class="row align-items-center">
               <div class="col-md-6">
                  <div class="d-flex align-items-center gap-3">
                     <button id="debug-toggle" class="btn btn-sm btn-secondary" title="Toggle debug mode">
                        🐛 Debug: OFF
                     </button>
                     <div id="connection-monitor" class="small opacity-75" title="Real-time server connection monitoring" style="display: none;">
                        <span class="badge bg-secondary">Server: 0 active</span>
                     </div>
                  </div>
               </div>
               <div class="col-md-6 text-end">
                  <small class="opacity-75 p-2" style="color: rgba(245, 158, 11, 0.3)">Debug Console</small>
               </div>
            </div>
         </div>
      `;

      return footer;
   }
}
