import api from '../lib/api.js';
export default class Projects {
   uiBuilder;

   constructor(uiBuilder) {
      this.projects = [];
      this.apiBaseUrl = 'http://localhost:3000'; // All available projects
      this.uiBuilder = uiBuilder;
      //this.parent = this.uiBuilder.container.querySelectorAll('');
      this.parent = null;

      this.dom = null;
   }

   setParent(parent) {
      this.parent = parent;
   }
   async init() {
      this.dom = document.createElement('select');
      this.dom.className = 'form-select'; // Bootstrap class for select
      this.dom.style.width = 'auto';
      this.dom.style.minWidth = '200px'; // Ensure minimum width
      this.dom.id = 'projects';
      const option = document.createElement('option');
      option.textContent = 'Loading projects...';
      option.value = '';
      this.dom.appendChild(option);
      this.dom.addEventListener('change', event => {
         const selectedSlug = event.target.value;
         console.log('Project selected!!!', selectedSlug);
         this.setProject(selectedSlug);
      });
      // FIXME: Might need to split init and and initProject to avoid race condition between dom elements
      return this.dom;
   }

   async start() {
      return this.initProjects();
   }

   async initProjects() {
      const data = await api.get('/projects');

      if (data.success) {
         // Load basic project info and stats
         this.projects = data.projects;

         this.updateProjects();
         this.loadProject();
      } else {
         throw Error('fail to load projects, server might be down');
      }
   }

   async loadProject() {
      let project;
      const slug = this.getProjectSlugFromUri();
      if (slug) {
         const project = this.projects.find(p => p.slug === slug);
         if (project) {
            this.setProject(project.slug);
         } else {
            throw new Error(`Project with slug "${selectedSlug}" not found.`);
         }
      } else if (this.projects.length > 0) {
         this.setProject(this.projects[0].slug);
      } else {
         // FIXME
         console.warn('FIXME: No projects available to load.');
      }
   }

   setProject(slug) {
      this.selectedSlug = slug;
      this.dispatch('project_selected', { slug: slug });
   }

   dispatch(eventName, detail) {
      const event = new CustomEvent(eventName, {
         detail: detail,
      });
      document.dispatchEvent(event);
   }

   updateProjects() {
      this.dom.innerHTML = '';
      this.projects.forEach(project => {
         const option = document.createElement('option');
         option.value = project.slug;
         option.textContent = `${project.name}`;
         this.dom.appendChild(option);
      });
   }

   getProjectSlugFromUri() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('slug');
   }

   updateProjectSelector() {
      if (!this.dom) {
         this.dom = document.getElementById('project-select');
      }
      if (!this.dom) return;
      this.dom.innerHTML = '';
      if (this.projects.length === 0) {
         this.dom.innerHTML = '<option>No projects available</option>';
         this.dom.disabled = true;
         return;
      }

      this.projects.forEach(project => {
         const option = document.createElement('option');
         option.value = project.slug;
         option.textContent = `${project.name} (${project.stats?.videos || 0} videos)`;
         this.dom.appendChild(option);
      });

      this.dom.disabled = false;

      // this.dom the current project if set
      if (this.currentProjectSlug) {
         this.dom.value = this.currentProjectSlug;
      }
   }

   selectVideo(video) {
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
            //await this.domProject(data.project.slug);

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
