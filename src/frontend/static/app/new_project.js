export default class NewProject {
   showNewProjectDialog() {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
         <div class="modal-dialog">
            <div class="modal-content">
               <div class="modal-header">
                  <h5 class="modal-title">🎬 Create New Project</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
               </div>
               <div class="modal-body">
                  <form id="new-project-form">
                     <div class="mb-3">
                        <label for="project-name" class="form-label">Project Name</label>
                        <input type="text" class="form-control" id="project-name" placeholder="My Video Project" required>
                        <div class="form-text">Choose a descriptive name for your project</div>
                     </div>
                  </form>
               </div>
               <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-primary" id="create-project-btn">Create Project</button>
               </div>
            </div>
         </div>
      `;

      document.body.appendChild(modal);

      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();

      // Handle form submission
      const createBtn = modal.querySelector('#create-project-btn');
      const projectNameInput = modal.querySelector('#project-name');

      createBtn.addEventListener('click', async () => {
         const projectName = projectNameInput.value.trim();
         if (!projectName) {
            projectNameInput.classList.add('is-invalid');
            return;
         }

         createBtn.disabled = true;
         createBtn.innerHTML = '⏳ Creating...';

         try {
            await this.createProject(projectName);
            bsModal.hide();
         } catch (error) {
            console.error('Error creating project:', error);
            createBtn.disabled = false;
            createBtn.innerHTML = 'Create Project';
         }
      });

      // Auto-focus the input
      modal.addEventListener('shown.bs.modal', () => {
         projectNameInput.focus();
      });

      // Clean up modal when hidden
      modal.addEventListener('hidden.bs.modal', () => {
         document.body.removeChild(modal);
      });
   }
}
