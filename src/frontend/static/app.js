import UiBuilder from './lib/UiBuilder.js';
import Debug from './debug.js';
import Project from './project.js';
import GlobalError from './global_error.js';
import Projects from './projects.js';
import ServerChecker from './server_checker.js';
import Editor from './editor.js';
import Header from './header.js';
import Footer from './footer.js';
import Timeline from './timeline.js';
import ActionMenu from './action_menu.js';

class ViaUi {
   constructor() {
      console.log('Launching VAI app...');
      this.uiBuilder = new UiBuilder();

      this.header = new Header(this.uiBuilder);
      this.projects = new Projects(this.uiBuilder);
      this.header.addProjects(this.projects);
      this.project = new Project();
      this.globalError = new GlobalError();
      this.ServerChecker = new ServerChecker();
      this.editor = new Editor();

      this.actionMenu = new ActionMenu(this.uiBuilder);
      this.footer = new Footer(this.uiBuilder);
      this.timeline = new Timeline();
      this.debug = new Debug();
   }

   async start() {
      this.app = {
         tree: {
            header: {
               element: await this.header.create(),
               childrens: {
                  projects: {
                     element: this.projects.createProjectSelector(),
                  },
                  /*actionMenu: {
                     element: this.actionMenu.create() || null,
                  },*/
               },
            },
            top: {
               element: this.uiBuilder.createTag('div', 'top', 'top bg-light'),
               childrens: {
                  player: {
                     element: this.projects.createPlayer(),
                  },
               },
            },
            main: {
               element: this.uiBuilder.createTag('div', 'main', 'main timeline'),
            } /*
            footer: {
               element: this.footer.create(),
            },*/,
         },
      };
      await this.uiBuilder.addApp(this.app);
      //this.projects.init();
      //this.project.init();
      //this.timeline.init();
      //this.debug.init();
      //this.globalError.init();
   }
}
const app = new ViaUi();
await app.start();
