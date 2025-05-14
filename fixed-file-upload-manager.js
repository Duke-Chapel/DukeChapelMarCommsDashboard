/**
 * Simplified file upload manager for the dashboard
 * Handles CSV file uploads for dashboard data
 */
document.addEventListener('DOMContentLoaded', function() {
  // Wait for DOM to be fully loaded before initializing
  setTimeout(function() {
    initFileUploadManager();
  }, 500);
});

function initFileUploadManager() {
  // Track uploaded files
  const uploadedFiles = {};
  
  // Create upload UI if it doesn't exist yet
  if (!document.getElementById('file-upload-modal')) {
    createUploadModal();
  }
  
  // Create fixed upload button if it doesn't exist
  if (!document.getElementById('upload-button')) {
    createUploadButton();
  }
  
  // Initialize handlers after ensuring UI elements exist
  setupEventHandlers();
  
  /**
   * Create the modal for file uploads
   */
  function createUploadModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'file-upload-modal';
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'fileUploadModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    // Set modal content
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="fileUploadModalLabel">Upload CSV Files</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="upload-area border rounded p-4 text-center mb-3" id="upload-dropzone">
              <i class="bi bi-cloud-arrow-up fs-1 text-muted mb-3 d-block"></i>
              <p>Drag and drop files here, or <button class="btn btn-link p-0" id="browse-files">browse for files</button></p>
              <input type="file" id="file-input" multiple style="display: none" accept=".csv">
            </div>
            
            <h6>Uploaded Files</h6>
            <div class="uploaded-files-list p-3 border rounded bg-light" style="max-height: 300px; overflow-y: auto;">
              <div id="no-files-message" class="text-center text-muted py-4">
                <p>No files uploaded yet</p>
              </div>
              <ul id="uploaded-files" class="list-group list-group-flush">
                <!-- Files will be listed here -->
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <div class="form-check me-auto">
              <input class="form-check-input" type="checkbox" id="auto-load" checked>
              <label class="form-check-label" for="auto-load">
                Automatically load new data after upload
              </label>
            </div>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button id="process-files" class="btn btn-primary">Update Dashboard</button>
          </div>
        </div>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(modal);
  }
  
  /**
   * Create fixed upload button
   */
  function createUploadButton() {
    const btn = document.createElement('button');
    btn.id = 'upload-button';
    btn.className = 'btn btn-primary position-fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '1000';
    btn.innerHTML = '<i class="bi bi-upload me-2"></i> Upload Files';
    
    document.body.appendChild(btn);
  }
  
  /**
   * Setup all event handlers
   */
  function setupEventHandlers() {
    // Upload button to open modal
    const uploadBtn = document.getElementById('upload-button');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('file-upload-modal'));
        modal.show();
      });
    }
    
    // Dropzone and file input
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-files');
    
    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
      });
    }
    
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
          handleFiles(fileInput.files);
        }
      });
    }
    
    if (dropzone) {
      // Prevent default behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
      });
      
      // Highlight the dropzone
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, function() {
          dropzone.classList.add('bg-light', 'border-primary');
        }, false);
      });
      
      // Remove highlight
      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, function() {
          dropzone.classList.remove('bg-light', 'border-primary');
        }, false);
      });
      
      // Handle dropped files
      dropzone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
      }, false);
    }
    
    // Process files button
    const processBtn = document.getElementById('process-files');
    if (processBtn) {
      processBtn.addEventListener('click', function() {
        processUploadedFiles();
      });
    }
  }
  
  /**
   * Prevent default drag/drop behaviors
   */
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  /**
   * Handle uploaded files
   */
  function handleFiles(files) {
    const filesList = document.getElementById('uploaded-files');
    const noFilesMsg = document.getElementById('no-files-message');
    
    if (!filesList || !noFilesMsg) return;
    
    // Hide "no files" message if we have files
    if (files.length > 0) {
      noFilesMsg.style.display = 'none';
    }
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verify it's a CSV file
      if (!file.name.toLowerCase().endsWith('.csv') && 
          file.type !== 'text/csv' &&
          file.type !== 'application/vnd.ms-excel') {
        showErrorMessage(file.name + ' is not a CSV file');
        continue;
      }
      
      // Store the file
      uploadedFiles[file.name] = file;
      
      // Create list item for the file
      const fileId = 'file-' + file.name.replace(/[^a-zA-Z0-9]/g, '-');
      let fileItem = document.getElementById(fileId);
      
      if (!fileItem) {
        fileItem = document.createElement('li');
        fileItem.id = fileId;
        fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Add file info and remove button
        fileItem.innerHTML = `
          <div>
            <i class="bi bi-file-earmark-text text-primary me-2"></i>
            <span>${file.name}</span>
            <small class="text-muted ms-2">(${formatFileSize(file.size)})</small>
          </div>
          <button class="btn btn-sm btn-outline-danger remove-file-btn">
            <i class="bi bi-trash"></i>
          </button>
        `;
        
        filesList.appendChild(fileItem);
        
        // Add event listener to remove button
        const removeBtn = fileItem.querySelector('.remove-file-btn');
        if (removeBtn) {
          removeBtn.addEventListener('click', function() {
            delete uploadedFiles[file.name];
            fileItem.remove();
            
            // Show "no files" message if we have no files left
            if (Object.keys(uploadedFiles).length === 0) {
              noFilesMsg.style.display = 'block';
            }
          });
        }
      }
    }
    
    // Auto-process if checked
    const autoLoad = document.getElementById('auto-load');
    if (autoLoad && autoLoad.checked) {
      processUploadedFiles();
    }
  }
  
  /**
   * Process the uploaded files
   */
  function processUploadedFiles() {
    if (Object.keys(uploadedFiles).length === 0) {
      showErrorMessage('No files to process');
      return;
    }
    
    // Show loader
    showLoader();
    
    try {
      // For demonstration - in a real implementation, this would:
      // 1. Process the files (read them, store in sessionStorage, etc)
      // 2. Trigger dashboard data reload
      
      // Add a processing indicator to each file
      Object.keys(uploadedFiles).forEach(fileName => {
        const fileId = 'file-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');
        const fileItem = document.getElementById(fileId);
        if (fileItem) {
          const fileInfo = fileItem.querySelector('div');
          if (fileInfo) {
            // Remove existing badge if any
            const existingBadge = fileInfo.querySelector('.badge');
            if (existingBadge) {
              existingBadge.remove();
            }
            
            // Add processing badge
            const badge = document.createElement('span');
            badge.className = 'badge bg-info ms-2';
            badge.textContent = 'Processing...';
            fileInfo.appendChild(badge);
          }
        }
      });
      
      // Simulate file processing delay
      setTimeout(function() {
        // Update file status and close modal
        Object.keys(uploadedFiles).forEach(fileName => {
          const fileId = 'file-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');
          const fileItem = document.getElementById(fileId);
          if (fileItem) {
            const fileInfo = fileItem.querySelector('div');
            if (fileInfo) {
              // Remove existing badge if any
              const existingBadge = fileInfo.querySelector('.badge');
              if (existingBadge) {
                existingBadge.remove();
              }
              
              // Add success badge
              const badge = document.createElement('span');
              badge.className = 'badge bg-success ms-2';
              badge.textContent = 'Processed';
              fileInfo.appendChild(badge);
            }
          }
        });
        
        // Hide loader
        hideLoader();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('file-upload-modal'));
        if (modal) {
          modal.hide();
        }
        
        // Show success message
        showSuccessMessage('Files processed successfully');
        
        // Reload dashboard data
        if (window.dashboardApi && typeof window.dashboardApi.reloadData === 'function') {
          window.dashboardApi.reloadData();
        } else {
          console.warn('Dashboard API not available for reloading data');
        }
        
      }, 1500);
    } catch (error) {
      // Hide loader
      hideLoader();
      
      // Show error message
      showErrorMessage('Error processing files: ' + error.message);
    }
  }
  
  /**
   * Format file size for display
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Show loader overlay
   */
  function showLoader() {
    // Create loader if it doesn't exist
    let loader = document.getElementById('global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.className = 'position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center';
      loader.style.backgroundColor = 'rgba(0,0,0,0.3)';
      loader.style.zIndex = '9999';
      
      // Add spinner
      const spinner = document.createElement('div');
      spinner.className = 'spinner-border text-light';
      spinner.setAttribute('role', 'status');
      spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
      
      loader.appendChild(spinner);
      document.body.appendChild(loader);
    }
    
    loader.style.display = 'flex';
  }
  
  /**
   * Hide loader overlay
   */
  function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }
  
  /**
   * Show error message
   */
  function showErrorMessage(message) {
    showToast(message, 'danger');
  }
  
  /**
   * Show success message
   */
  function showSuccessMessage(message) {
    showToast(message, 'success');
  }
  
  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '1050';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set content
    toast.innerHTML = `
      <div class="toast-header ${type === 'danger' ? 'bg-danger text-white' : ''}">
        <strong class="me-auto">Dashboard</strong>
        <small>Just now</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize toast
    const bootstrapToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 5000
    });
    
    // Show toast
    bootstrapToast.show();
    
    // Remove when hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  }
  
  // Return public methods
  return {
    getUploadedFiles: function() {
      return {...uploadedFiles};
    },
    processFiles: processUploadedFiles
  };
}

// Store the manager instance in window for global access
window.fileUploadManager = initFileUploadManager();
