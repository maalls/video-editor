export default class Projects {
   uiBuilder;

   constructor(uiBuilder) {
      this.projects = [];
      this.apiBaseUrl = 'http://localhost:3000'; // All available projects
      this.uiBuilder = uiBuilder;
      //this.parent = this.uiBuilder.container.querySelectorAll('');
      this.parent = null;
      this.select = document.createElement('select');
   }

   setParent(parent) {
      this.parent = parent;
   }
   async init() {
      /* 
      TODO: for now we fetch it from here, but:
      - must be handle by the UiBuilder from the User Tree definition.
      - should be defined in the constructor by the UiBuilder.
      */
      console.log('[projects] parent:', this.parent);
      /*if (!this.parent) {
         console.error('❌ Could not find header element to attach project selector');
         return;
      }*/
      await this.loadProjects();
      // Set up project selector event handlers
      this.refresh();

      let targetProject = null;
      const slug = this.getProjectSlugFromUri();

      if (slug) {
         // Try to find project by slug
         targetProject = this.projects.find(p => p.slug === slug);
         if (!targetProject) {
            throw new Error(
               `Project "${slug}" was not found. Loading first available project instead.`
            );
         }
      } else {
         targetProject = this.projects[0];
      }

      if (targetProject) {
         await this.selectProject(targetProject.slug);
      } else {
         // FIXME: empty condition
         //this.showEmptyState();
      }
   }

   getProjectSlugFromUri() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('slug');
   }

   refresh() {
      const select = this.select;
      if (select) {
         console.log('clearing select');
         select.innerHTML = '';

         select.addEventListener('change', async e => {
            const selectedSlug = e.target.value;
            if (selectedSlug && selectedSlug !== this.currentProjectSlug) {
               await this.selectProject(selectedSlug);
            }
         });
      } else {
         throw new Error('No project select dom found.');
      }
   }

   createProjectSelector() {
      const div = document.createElement('div');
      div.className = 'row align-items-center p-2 bg-dark col-md-3';
      div.id = 'project-selector-container';
      div.innerHTML = `
                  <select id="project-select" class="" style="width: auto; min-width: 200px;">
                     <option>Loading projects...</option>
                  </select>
              `;

      //this.uiBuilder.container.querySelector('#projects').appendChild(div);
      this.select = div;
      return div;
   }

   getUrlProjectId() {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId =
         urlParams.get('project') || urlParams.get('projectId') || urlParams.get('id');
      console.log('🔗 URL project parameter:', projectId);
      return projectId;
   }

   async loadProjects() {
      try {
         const response = await fetch(`${this.apiBaseUrl}/projects`);
         const data = await response.json();

         if (data.success) {
            // Load basic project info and stats
            this.projects = data.projects;
            console.log('[projects] projects loaded', this.projects);

            // TODO: Must not load all projects!
            //this.loadAllProjects(data);

            const urlParams = new URLSearchParams(window.location.search);
            this.currentProjectSlug = urlParams.get('slug');
            if (!this.currentProjectSlug) {
               this.currentProjectSlug = this.projects[0]?.slug;
            }

            this.updateProjectSelector();
         } else {
            console.error('❌ Failed to load projects:', data.error);
            this.showError('Failed to load projects', data.error);
         }
      } catch (error) {
         console.error('❌ Error loading projects:', error);
         this.showError('Connection Error', 'Could not connect to server');
      }
   }

   async loadAllProjects(data) {
      for (const project of data.projects) {
         try {
            // Get project details including stats
            const detailResponse = await fetch(`${this.apiBaseUrl}/projects/${project.slug}`);
            const detailData = await detailResponse.json();
            //console.log('Project details:', detailData);
            if (detailData.success) {
               this.projects.push(detailData.project);
            } else {
               throw new Error(detailData.error || 'Unknown error fetching project details');
            }
         } catch (err) {
            console.warn(`Could not load stats for ${project.slug}:`, err);
            this.projects.push(project);
         }
      }
   }

   async selectProject(projectSlug) {
      if (this.currentProjectSlug === projectSlug) {
         console.log('Project already selected:', projectSlug);
         return;
      }

      console.log('🎬 Selecting project:', projectSlug);
      this.isLoading = true;

      // Clear any currently playing video before switching projects

      try {
         // Use the project endpoint that includes videos (dailies)
         const response = await fetch(`${this.apiBaseUrl}/projects/${projectSlug}/project`);
         const data = await response.json();

         if (response.ok && data) {
            this.currentProject = data;
            this.currentProjectSlug = projectSlug;

            console.log('✅ Project loaded:', this.currentProject);
            console.log('📹 Videos in project:', this.currentProject.dailies?.length || 0);

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('slug', projectSlug);
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

            window.history.pushState({}, '', newUrl);

            console.log("📣 Dispatching 'project_selected' event");
            const event = new CustomEvent('project_selected', {
               detail: { project: this.currentProject },
            });
            document.dispatchEvent(event);

            // Update UI
            //this.updateProjectDisplay();
            //this.loadEditor();
            //this.loadDisplay();

            // Update URL to reflect current project
            //this.project.setId(projectSlug);
         } else {
            console.error('❌ Failed to load project:', data?.error || 'Unknown error');
            this.showError('Failed to load project', data?.error || 'Unknown error');
            // Keep video cleared since project failed to load
         }
      } catch (error) {
         console.error('❌ Error loading project:', error);
         this.showError('Connection Error', 'Could not load project data');
         // Keep video cleared since project failed to load
      } finally {
         this.isLoading = false;
      }
   }

   updateProjectSelector() {
      if (!this.select) {
         this.select = document.getElementById('project-select');
      }

      console.log('[projects] Updating project selector', this.select, this.projects);

      if (!this.select) return;
      this.select.innerHTML = '';
      if (this.projects.length === 0) {
         this.select.innerHTML = '<option>No projects available</option>';
         this.select.disabled = true;
         return;
      }

      this.projects.forEach(project => {
         const option = document.createElement('option');
         option.value = project.slug;
         option.textContent = `${project.name} (${project.stats?.videos || 0} videos)`;
         this.select.appendChild(option);
      });

      this.select.disabled = false;

      // this.Select the current project if set
      if (this.currentProjectSlug) {
         this.select.value = this.currentProjectSlug;
      }
   }

   selectVideo(video) {
      console.log('📹 Selected video:', video);

      // Update the selected state in sidebar
      document.querySelectorAll('.list-group-item').forEach(item => {
         item.classList.remove('active');
      });

      // Find and highlight the selected video
      const videoItems = document.querySelectorAll('.list-group-item');
      videoItems.forEach(item => {
         if (item.innerHTML.includes(video.filename)) {
            item.classList.add('active');
         }
      });

      // Load and display the video
      this.showVideoDetails(video.filename);
   }

   async createProject(projectName) {
      try {
         const response = await fetch(`${this.apiBaseUrl}/projects`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: projectName }),
         });

         const data = await response.json();

         if (data.success) {
            console.log('✅ Project created:', data.project);

            // Reload projects and select the new one
            await this.loadProjects();
            await this.selectProject(data.project.slug);

            // Show success message
            this.showSuccess('Project Created', `"${projectName}" has been created successfully!`);
         } else {
            console.error('❌ Failed to create project:', data.error);
            this.showError('Failed to create project', data.error);
         }
      } catch (error) {
         console.error('❌ Error creating project:', error);
         this.showError('Connection Error', 'Could not create project');
      }
   }

   updateProjectDisplay() {
      // Update any project-specific UI elements here
      const projectInfo = document.querySelector('.project-info');
      if (projectInfo && this.currentProject) {
         projectInfo.innerHTML = `
            <h6>📁 ${this.currentProject.name}</h6>
            <small class="text-muted">${this.currentProject.stats?.videos || 0} videos • ${this.currentProject.stats?.totalSizeFormatted || 'Unknown size'}</small>
         `;
      }

      // Update browser title to include project name
      if (this.currentProject) {
         document.title = `VIAI - ${this.currentProject.name}`;
      }

      // Show/hide share button based on whether a project is selected
      const shareBtn = document.getElementById('share-project-btn');
      if (shareBtn) {
         shareBtn.style.display = this.currentProjectSlug ? 'inline-block' : 'none';
      }
   }

   createPlayer() {
      const ratio = 1920 / 1080;
      const height = 300;
      const width = height * ratio;
      const videoPlayer = this.uiBuilder.createTag(
         'video',
         'main-player',
         'video main-video-player'
      );
      videoPlayer.setAttribute('id', 'main-video-player');
      videoPlayer.setAttribute('class', 'video');
      videoPlayer.setAttribute('controls', '');
      videoPlayer.setAttribute('preload', 'meta');
      videoPlayer.setAttribute(
         'style',
         `width: ${width}px; height: ${height}px; background: #000;`
      );

      // Add event listeners only once
      videoPlayer.addEventListener('timeupdate', () => {
         // Only update playhead if we're not in the middle of a seek operation
         if (!this.isSeeking && this.currentVideo) {
            if (this.debugConfig.log_video_events) {
               //console.log('updating playhead', videoPlayer.currentTime);
            }
            this.updatePlayheadPosition(videoPlayer.currentTime);
         }
      });

      videoPlayer.addEventListener('loadedmetadata', () => {
         this.videoDuration = videoPlayer.duration;
         console.log(
            'Video duration loaded:',
            this.videoDuration,
            'for',
            this.currentVideo?.filename
         );
      });

      videoPlayer.addEventListener('loadeddata', () => {
         // Show video when data is loaded (for normal video display, not timeline seeks)
         if (!this.isSeeking) {
            this.getPlayer().poster = '';
            this.getPlayer().style.visibility = 'visible';
         }
      });
      return videoPlayer;
   }
}
