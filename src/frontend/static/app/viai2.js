import Header from './header/header.js';
/*import Projects from './projects.js';
import Editor from './editor/editor.js';

import Player from './player.js';
import Logo from './logo.js';
*/

export default class ViaUi {
   // FIXME: proper automation

   constructor() {
      this.app = {
         tree: {
            header: {
               /*
               logo: {},
               projects: {},
            },
            editor: {
               player: {},
            */
            },
         },
         map: {
            header: new Header(this.uiBuilder),
            /*projects: new Projects(this.uiBuilder),
            editor: new Editor(),
            player: new Player(),
            logo: new Logo(),*/
         },
      };
   }
}
