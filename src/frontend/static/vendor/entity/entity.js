class Entity {

   async start(AppClass) {

      const app = new AppClass();
      //console.log('app',app);
      return await app.start();
   }
}

const entity = new Entity();

export default entity;
