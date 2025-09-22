import fs from 'fs';
import path from 'path';

/**
 * ProjectManager handles multi-project workspace organization
 * Each project has its own slug, workspace directory, and isolated resources
 */
export default class ProjectManager {
   constructor(workspaceRoot) {
      this.workspaceRoot = workspaceRoot;
      this.projectsFile = path.join(workspaceRoot, 'projects.json');
      this.projects = this.loadProjects();
   }

   /**
    * Load projects registry from file
    */
   loadProjects() {
      if (fs.existsSync(this.projectsFile)) {
         try {
            const content = fs.readFileSync(this.projectsFile, 'utf8');
            return JSON.parse(content);
         } catch (error) {
            console.warn('Error loading projects file:', error);
            return {};
         }
      }
      return {};
   }

   /**
    * Save projects registry to file
    */
   saveProjects() {
      fs.writeFileSync(this.projectsFile, JSON.stringify(this.projects, null, 2));
   }

   /**
    * Generate a valid slug from project name
    */
   generateSlug(name) {
      return name
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '')
         .substring(0, 50);
   }

   /**
    * Validate project slug format
    */
   isValidSlug(slug) {
      return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug);
   }

   /**
    * Check if project slug already exists
    */
   projectExists(slug) {
      return slug in this.projects;
   }

   /**
    * Get project workspace directory path
    */
   getProjectPath(slug) {
      return path.join(this.workspaceRoot, slug);
   }

   /**
    * Get project dailies directory path
    */
   getProjectDailiesPath(slug) {
      return path.join(this.getProjectPath(slug), 'dailies');
   }

   /**
    * Get project thumbnails directory path
    */
   getProjectThumbnailsPath(slug) {
      return path.join(this.getProjectPath(slug), 'thumbnails');
   }

   /**
    * Get project database file path
    */
   getProjectDatabasePath(slug) {
      return path.join(this.getProjectPath(slug), 'database.json');
   }

   /**
    * Get project preferences file path
    */
   getProjectPreferencesPath(slug) {
      return path.join(this.getProjectPath(slug), 'preferences.json');
   }

   /**
    * Create default preferences for a new project
    */
   createDefaultPreferences(projectName, slug) {
      return {
         name: projectName,
         slug: slug,
         created: new Date().toISOString(),
         settings: {
            videoFormat: 'MP4',
            compressionProfile: 'workspace_basic',
            thumbnailQuality: 'medium',
            autoGenerateThumbnails: true,
         },
         metadata: {
            description: '',
            tags: [],
            collaborators: [],
         },
      };
   }

   /**
    * Create a new project workspace
    */
   createProject(name, customSlug = null) {
      const slug = customSlug || this.generateSlug(name);

      // Validate slug
      if (!this.isValidSlug(slug)) {
         throw new Error(
            `Invalid project slug: ${slug}. Must contain only lowercase letters, numbers, and hyphens.`
         );
      }

      // Check if project already exists
      if (this.projectExists(slug)) {
         throw new Error(`Project with slug '${slug}' already exists`);
      }

      const projectPath = this.getProjectPath(slug);

      try {
         // Create project directory structure
         fs.mkdirSync(projectPath, { recursive: true });
         fs.mkdirSync(this.getProjectDailiesPath(slug), { recursive: true });
         fs.mkdirSync(this.getProjectThumbnailsPath(slug), { recursive: true });

         // Create preferences.json
         const preferences = this.createDefaultPreferences(name, slug);
         fs.writeFileSync(
            this.getProjectPreferencesPath(slug),
            JSON.stringify(preferences, null, 2)
         );

         // Create empty database.json
         fs.writeFileSync(this.getProjectDatabasePath(slug), JSON.stringify({}, null, 2));

         // Register project
         this.projects[slug] = {
            name: name,
            slug: slug,
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            path: projectPath,
         };

         this.saveProjects();

         console.log(`✅ Created project '${name}' with slug '${slug}'`);
         return { slug, name, path: projectPath };
      } catch (error) {
         // Cleanup on failure
         if (fs.existsSync(projectPath)) {
            fs.rmSync(projectPath, { recursive: true, force: true });
         }
         throw new Error(`Failed to create project: ${error.message}`);
      }
   }

   /**
    * Get project information
    */
   getProject(slug) {
      if (!this.projectExists(slug)) {
         throw new Error(`Project '${slug}' not found`);
      }

      const projectInfo = this.projects[slug];
      const preferencesPath = this.getProjectPreferencesPath(slug);

      let preferences = {};
      if (fs.existsSync(preferencesPath)) {
         try {
            preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
         } catch (error) {
            console.warn(`Error loading preferences for project '${slug}':`, error);
         }
      }

      return {
         ...projectInfo,
         preferences,
         paths: {
            root: this.getProjectPath(slug),
            dailies: this.getProjectDailiesPath(slug),
            thumbnails: this.getProjectThumbnailsPath(slug),
            database: this.getProjectDatabasePath(slug),
            preferences: this.getProjectPreferencesPath(slug),
         },
      };
   }

   /**
    * List all projects
    */
   listProjects() {
      return Object.values(this.projects).map(project => ({
         slug: project.slug,
         name: project.name,
         created: project.created,
         lastAccessed: project.lastAccessed,
      }));
   }

   /**
    * Update project last accessed time
    */
   updateLastAccessed(slug) {
      if (this.projectExists(slug)) {
         this.projects[slug].lastAccessed = new Date().toISOString();
         this.saveProjects();
      }
   }

   /**
    * Delete a project and its workspace
    */
   deleteProject(slug) {
      if (!this.projectExists(slug)) {
         throw new Error(`Project '${slug}' not found`);
      }

      const projectPath = this.getProjectPath(slug);

      try {
         // Remove project directory
         if (fs.existsSync(projectPath)) {
            fs.rmSync(projectPath, { recursive: true, force: true });
         }

         // Remove from registry
         delete this.projects[slug];
         this.saveProjects();

         console.log(`✅ Deleted project '${slug}'`);
         return true;
      } catch (error) {
         throw new Error(`Failed to delete project: ${error.message}`);
      }
   }

   /**
    * Rename a project (updates name, not slug)
    */
   renameProject(slug, newName) {
      if (!this.projectExists(slug)) {
         throw new Error(`Project '${slug}' not found`);
      }

      try {
         // Update project registry
         this.projects[slug].name = newName;
         this.saveProjects();

         // Update preferences file
         const preferencesPath = this.getProjectPreferencesPath(slug);
         if (fs.existsSync(preferencesPath)) {
            const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
            preferences.name = newName;
            fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
         }

         console.log(`✅ Renamed project '${slug}' to '${newName}'`);
         return true;
      } catch (error) {
         throw new Error(`Failed to rename project: ${error.message}`);
      }
   }

   /**
    * Get project statistics
    */
   getProjectStats(slug) {
      if (!this.projectExists(slug)) {
         throw new Error(`Project '${slug}' not found`);
      }

      const dailiesPath = this.getProjectDailiesPath(slug);
      const thumbnailsPath = this.getProjectThumbnailsPath(slug);
      const databasePath = this.getProjectDatabasePath(slug);

      let videoCount = 0;
      let thumbnailCount = 0;
      let databaseSize = 0;

      try {
         if (fs.existsSync(dailiesPath)) {
            const dailies = fs.readdirSync(dailiesPath);
            videoCount = dailies.filter(file => file.toLowerCase().endsWith('.mp4')).length;
         }

         if (fs.existsSync(thumbnailsPath)) {
            const thumbnails = fs.readdirSync(thumbnailsPath);
            thumbnailCount = thumbnails.filter(
               file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')
            ).length;
         }

         if (fs.existsSync(databasePath)) {
            const dbContent = fs.readFileSync(databasePath, 'utf8');
            databaseSize = Object.keys(JSON.parse(dbContent)).length;
         }
      } catch (error) {
         console.warn(`Error calculating stats for project '${slug}':`, error);
      }

      return {
         videos: videoCount,
         thumbnails: thumbnailCount,
         databaseEntries: databaseSize,
      };
   }
}
