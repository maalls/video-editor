import Mustache from '../vendor/mustache/mustache.mjs';

class Template {
   constructor() {
      this.parser = new DOMParser();
      this.setupMustacheStrictMode();
   }

   setupMustacheStrictMode() {
      // Configure Mustache to throw errors for undefined variables
      const originalLookup = Mustache.Context.prototype.lookup;

      Mustache.Context.prototype.lookup = function (name) {
         const value = originalLookup.call(this, name);

         // If value is undefined and it's not a special Mustache variable
         if (value === undefined && !name.startsWith('.') && name !== '' && name !== '.') {
            throw new Error(`Mustache template error: Variable '${name}' is undefined`);
         }

         return value;
      };
   }

   async dom(path) {
      const html = await this.fetch(path);
      console.log('path html', path, html);
      const template = document.createElement('template');
      template.innerHTML = html.trim();

      const children = template.content.children;

      if (children.length === 1) {
         return children[0]; // Single element
      } else if (children.length > 1) {
         return template.content.cloneNode(true); // DocumentFragment for multiple
      } else {
         return null; // No elements
      }
   }

   // Render template with Mustache variables (strict mode)
   async render(html, variables = {}) {
      try {
         return Mustache.render(html, variables);
      } catch (error) {
         console.error('Mustache template error:', error.message);
         console.error('Template:', html);
         console.error('Variables:', variables);
         throw error; // Re-throw the error
      }
   }

   // Alternative: Pre-validate template variables
   validateTemplate(html, variables = {}) {
      // Find all {{variable}} patterns in the template
      const variablePattern = /\{\{([^{}]+)\}\}/g;
      const matches = [];
      let match;

      while ((match = variablePattern.exec(html)) !== null) {
         const variableName = match[1].trim();

         // Skip Mustache control structures
         if (
            variableName.startsWith('#') ||
            variableName.startsWith('/') ||
            variableName.startsWith('^') ||
            variableName.startsWith('&') ||
            variableName === '.'
         ) {
            continue;
         }

         matches.push(variableName);
      }

      // Check if all variables exist
      const missingVars = [];
      matches.forEach(varName => {
         const parts = varName.split('.');
         let current = variables;

         for (const part of parts) {
            if (current === null || current === undefined || !(part in current)) {
               missingVars.push(varName);
               break;
            }
            current = current[part];
         }
      });

      if (missingVars.length > 0) {
         throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
      }

      return true;
   }

   // Strict render with pre-validation
   async renderStrict(html, variables = {}) {
      this.validateTemplate(html, variables);
      return this.render(html, variables);
   }

   // Get size/length of any variable
   getVariableSize(variable) {
      if (variable === null || variable === undefined) {
         return 0;
      }

      if (typeof variable === 'string') {
         return variable.length;
      }

      if (Array.isArray(variable)) {
         return variable.length;
      }

      if (typeof variable === 'object') {
         return Object.keys(variable).length;
      }

      if (typeof variable === 'number' || typeof variable === 'boolean') {
         return String(variable).length;
      }

      return 0;
   }

   // Get memory size (approximate) in bytes
   getMemorySize(variable) {
      try {
         return JSON.stringify(variable).length;
      } catch {
         return 0;
      }
   }

   // Convert object properties to array for iteration
   objectToKeyValueArray(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
         return [];
      }

      return Object.keys(obj).map(key => ({
         key: key,
         value: obj[key],
         type: typeof obj[key],
      }));
   }

   // Render with size information added
   async renderWithSizes(path, variables = {}) {
      const html = await this.fetch(path);

      // Add size information for each variable
      const enhancedVars = { ...variables };

      Object.keys(variables).forEach(key => {
         const value = variables[key];
         enhancedVars[`${key}_size`] = this.getVariableSize(value);
         enhancedVars[`${key}_bytes`] = this.getMemorySize(value);

         // Add type information too
         enhancedVars[`${key}_type`] = Array.isArray(value) ? 'array' : typeof value;
      });

      return this.render(html, enhancedVars);
   }

   // Render with object properties exposed as arrays
   async renderWithChildren(path, variables = {}) {
      const html = await this.fetch(path);

      // Add children arrays for each object variable
      const enhancedVars = { ...variables };

      Object.keys(variables).forEach(key => {
         const value = variables[key];

         // Add properties as iterable array
         if (value && typeof value === 'object' && !Array.isArray(value)) {
            enhancedVars[`${key}_children`] = this.objectToKeyValueArray(value);
            enhancedVars[`${key}_keys`] = Object.keys(value);
         }
      });

      return this.render(html, enhancedVars);
   }

   async fetch(path) {
      const req = await fetch(`static/app/${path}.html`);
      return await req.text();
   }
}
const template = new Template();
export default template;
