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
import Player from './player.js';

class ViaUi {


   // FIXME: proper automation
   

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

      this.map = null;
   }

   async start() {
      this.app = {
         tree: {
            header: {
               projects: {
                  //element: this.projects.createProjectSelector(),
               },
               /*actionMenu: {
                  element: this.actionMenu.create() || null,
               },*/
               },
            top: {
               /*player: {
                  element: this.projects.createPlayer(),
               },*/
               player: {},
            },
            /*
            main: {
               element: this.uiBuilder.createTag('div', 'main', 'main timeline'),
            } 
            */
            main: {}
            /*
            footer: {
               element: this.footer.create(),
            },*/,
         }
      }

      this.app = {
         tree: {
            header: {
               projects: {}
            },
            editor: {
               player: {}
            },
            
         },
         map: {
            'header': new Header(this.uiBuilder),
            'projects': new Projects(this.uiBuilder),
            'editor': new Editor(),
            'player': new Player(),
         }
      }
      
      await this.uiBuilder.addApp(this.app);
      
   }
}
const app = new ViaUi();
await app.start();
