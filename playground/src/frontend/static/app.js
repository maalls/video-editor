import entity from './vendor/entity/entity.js';
import ViaUi from './app/viai2.js';
import UiBuilder from './lib/UiBuilder.js';

const viAi = new ViaUi();

console.log('viAi', viAi);
const uiBuilder = new UiBuilder();
uiBuilder.addApp(viAi);
