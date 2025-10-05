import UiBuilder from '../lib/UiBuilder.js';
import Projects from './projects.js';
import Editor from './editor/editor.js';
import Header from './header/header.js';
import Player from './player.js';
import Logo from './logo.js';

class ViaUi {
   // FIXME: proper automation

   constructor() {
      console.log('yooo');
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
