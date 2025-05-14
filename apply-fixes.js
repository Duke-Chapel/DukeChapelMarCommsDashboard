/**
 * Fix script to apply dashboard fixes
 * This script should be added to index.html to apply fixes without replacing files
 */

// Add script tags for the fixes
const fixScripts = [
  'enhanced-data-service-fix.js',
  'dashboard-fix.js'
];

// Function to add script tags to the document
function applyFixScripts() {
  // Wait for DOM to be loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addScriptTags);
  } else {
    addScriptTags();
  }
}

// Add the script tags
function addScriptTags() {
  fixScripts.forEach(script => {
    const scriptElement = document.createElement('script');
    scriptElement.src = script;
    document.body.appendChild(scriptElement);
  });

  // Also fix the file upload manager error
  fixFileUploadManagerError();
}

// Fix file upload manager error
function fixFileUploadManagerError() {
  // Create upload button manually
  setTimeout(() => {
    if (!document.getElementById('upload-button')) {
      const btn = document.createElement('button');
      btn.id = 'upload-button';
      btn.className = 'btn btn-primary position-fixed';
      btn.style.bottom = '20px';
      btn.style.right = '20px';
      btn.style.zIndex = '1000';
      btn.innerHTML = '<i class="bi bi-upload me-2"></i> Upload Files';
      
      document.body.appendChild(btn);
      
      // Add click event to show modal
      btn.addEventListener('click', function() {
        // Create modal first if not exists
        if (!document.getElementById('file-upload-modal')) {
          createFileUploadModal();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('file-upload-modal'));
        modal.show();
      });
    }
  }, 1000);
}

// Create file upload modal
function createFileUploadModal() {
  const modal = document.createElement('div');
  modal.id = 'file-upload-modal';
  modal.className = 'modal fade';
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-labelledby', 'fileUploadModalLabel');
  modal.setAttribute('aria-hidden', 'true');
  
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
  
  document.body.appendChild(modal);
  
  // Add event listeners for file uploads
  setupFileUploadEvents();
}

// Setup file upload events
function setupFileUploadEvents() {
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-files');
  const dropzone = document.getElementById('upload-dropzone');
  const processBtn = document.getElementById('process-files');
  
  // Handle browse button
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      fileInput.click();
    });
  }
  
  // Handle file selection
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
      }
    });
  }
  
  // Handle drag and drop
  if (dropzone) {
    // Prevent default behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, false);
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
  
  // Handle process button
  if (processBtn) {
    processBtn.addEventListener('click', function() {
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('file-upload-modal'));
      if (modal) {
        modal.hide();
      }
      
      // Show success message
      showMessage('Files processed successfully', 'success');
      
      // Force refresh the dashboard
      if (window.dashboardApi && window.dashboardApi.reloadData) {
        window.dashboardApi.reloadData();
      } else if (window.dateFilter) {
        const currentFilter = window.dateFilter.getCurrentDateFilter();
        if (typeof updateDashboard === 'function') {
          updateDashboard(currentFilter);
        }
      }
    });
  }
}

// Handle uploaded files
function handleFiles(files) {
  const filesList = document.getElementById('uploaded-files');
  const noFilesMsg = document.getElementById('no-files-message');
  
  if (!filesList || !noFilesMsg) return;
  
  // Hide "no files" message
  if (files.length > 0) {
    noFilesMsg.style.display = 'none';
  }
  
  // Track uploaded files
  window.uploadedFiles = window.uploadedFiles || {};
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Add to tracking
    window.uploadedFiles[file.name] = file;
    
    // Create list item
    const itemId = `file-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
    let item = document.getElementById(itemId);
    
    if (!item) {
      item = document.createElement('li');
      item.id = itemId;
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      
      // Format file size
      const fileSize = formatFileSize(file.size);
      
      // Add content
      item.innerHTML = `
        <div>
          <i class="bi bi-file-earmark-text text-primary me-2"></i>
          <span>${file.name}</span>
          <small class="text-muted ms-2">(${fileSize})</small>
        </div>
        <button class="btn btn-sm btn-outline-danger remove-file">
          <i class="bi bi-trash"></i>
        </button>
      `;
      
      filesList.appendChild(item);
      
      // Set up remove button
      const removeBtn = item.querySelector('.remove-file');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          // Remove from tracking
          delete window.uploadedFiles[file.name];
          
          // Remove from list
          item.remove();
          
          // Show "no files" message if empty
          if (Object.keys(window.uploadedFiles).length === 0) {
            noFilesMsg.style.display = 'block';
          }
        });
      }
    }
  }
  
  // Auto-process if enabled
  const autoLoad = document.getElementById('auto-load');
  if (autoLoad && autoLoad.checked && files.length > 0) {
    const processBtn = document.getElementById('process-files');
    if (processBtn) {
      processBtn.click();
    }
  }
}

// Format file size helper
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show message toast
function showMessage(message, type = 'info') {
  // Create toast container if needed
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
    <div class="toast-body ${type === 'danger' ? 'bg-danger text-white' : ''}">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Initialize and show
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove when hidden
  toast.addEventListener('hidden.bs.toast', function() {
    toast.remove();
  });
}

// Apply the fixes
applyFixScripts();
