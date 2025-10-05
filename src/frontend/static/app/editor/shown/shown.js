import template from '../../../lib/template.js';
import api from '../../../lib/api.js';

export default class Shown {
   async render(project, template) {
      const dailies = await api.get(`/projects/${project.slug}/videos`);
      console.log('dailies', dailies);
      return template.render({ project, dailies });
   }
}
