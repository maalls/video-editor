import PurBuilder from './PurBuilder.js';

const builder = new PurBuilder();

const toto = builder.contextualize({
   pierre: {
      agnes: {
         malo: 'hello',
         mitsu: 'mitsu',
      },
      jean_marie: null,
   },
});

console.log(toto);
