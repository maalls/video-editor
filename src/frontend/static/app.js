import UiBuilder from './lib/UiBuilder.js';
import Projects from './app/projects.js';
import Editor from './app/editor.js';
import Header from './app/header.js';
import Player from './app/player.js';
import Logo from './app/logo.js';

class ViaUi {
   // FIXME: proper automation

   constructor() {
      this.app = null;
      this.map = null;
      this.uiBuilder = new UiBuilder();
   }

   async start() {
      this.app = {
         tree: {
            header: {
               logo: {},
               projects: {},
            },
            editor: {
               player: {},
            },
         },
         map: {
            header: new Header(this.uiBuilder),
            projects: new Projects(this.uiBuilder),
            editor: new Editor(),
            player: new Player(),
            logo: new Logo(),
         },
      };

      await this.uiBuilder.addApp(this.app);
   }
}
const app = new ViaUi();

try {
   await app.start();
} catch (error) {
   console.error('Failed to start the app:', error);
   throw error;
}
