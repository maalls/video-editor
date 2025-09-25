import api from '../lib/api.js';
export default class Editor {
   constructor() {
      this.dom = null;
   }

   async init({ player }) {
      this.dom = document.createElement('div');
      this.dom.className = 'editor';
      this.dom.innerHTML = "<div><p>Editor</p><div id='player-container'></div></div>";

      this.dom.querySelector('#player-container').appendChild(player.dom);
      document.addEventListener('project_selected', event => {
         const slug = event.detail.slug; // ✅ Access the nested project object
         this.dom.innerHTML = `loading: ${slug}`;
         this.loadEditorForProject(slug);
      });

      return this.dom;
   }

   async loadEditorForProject(slug) {
      const data = await api.get(`/projects/${slug}/project`);
      this.project = data;
      this.startEditor();
   }

   async startEditor() {
      if (!this.project) {
         throw new Error('Cannot start editor, no project loaded');
      }

      this.dom.innerHTML = `Editor for project: ${this.project.name} (slug: ${this.project.slug})`;
      this.dispatch('project_loaded', { project: this.project });
   }

   dispatch(eventName, detail) {
      const event = new CustomEvent(eventName, {
         detail: detail,
      });

      document.dispatchEvent(event);
   }
}
