import api from '../../lib/api.js';
import template from '../../lib/template.js';

import Shown from './shown/shown.js';

export default class Editor {
   constructor() {
      this.dom = null;
   }

   async init(dom, { player }) {
      this.template = {
         create: await template.fetch('editor/create/create'),
         loading: await template.fetch('editor/shown/loading'),
         shown: await template.fetch('editor/shown/shown'),
      };

      this.dom = document.createElement('div');
      this.dom.className = 'editor';
      this.dom.innerHTML = this.template.no_project;
      this.player = player;

      document.addEventListener('project_selected', event => {
         const slug = event.detail.slug; // ✅ Access the nested project object
         this.dom.innerHTML = this.template.loading;
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
      const project = this.project;
      if (!project) {
         throw new Error('Cannot start editor, no project loaded');
      }

      console.log('GO', project);

      await new Shown().render(this.dom, project);
      this.dispatch('project_shown', { project });
   }

   render(dom) {
      this.dom = dom;
   }

   dispatch(eventName, detail) {
      const event = new CustomEvent(eventName, {
         detail: detail,
      });

      document.dispatchEvent(event);
   }
}
