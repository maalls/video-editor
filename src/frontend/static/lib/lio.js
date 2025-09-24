let indent = 0;

function l(...args) {
   
   if(indent) {
      const prefix = indent ? ' '.repeat(indent * 3) : '';
      console.log(prefix, ...args);
   }
   console.log(...args);
}
function i(args) {
   l(args);
   indent++;
}

function o(args) {
   indent--;
   l(args);
}
export { l, i, o };