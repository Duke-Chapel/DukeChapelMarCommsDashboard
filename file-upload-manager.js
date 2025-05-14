/**
 * This file contains implementation of a file upload system
 * for the marketing dashboard that handles automatic CSV imports
 */

// Create the file upload manager
function createFileUploadManager() {
  // Keep track of uploaded files
  const uploadedFiles = {};
  
  // Create upload UI
  const createUploadUI = () => {
    // Find a good place for the upload UI
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Create upload card
    const uploadCard = document.createElement('div');
    uploadCard.className = 'dashboard-section mb-4';
    uploadCard.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h3 class="h5 mb-3">Upload CSV Files</h3>
          <p class="text-muted">Simply drag and drop or select your CSV files from each platform to update the dashboard.</p>
          
          <div class="upload-area border rounded p-4 text-center mb-3" id="upload-dropzone">
            <i class="bi bi-cloud-arrow-up fs-1 text-muted mb-3"></i>
            <p>Drag and drop files here, or <button class="btn btn-link p-0" id="browse-files">browse for files</button></p>
            <input type="file" id="file-input" multiple style="display: none" accept=".csv">
          </div>
          
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="auto-load" checked>
            <label class="form-check-label" for="auto-load">
              Automatically load new data after upload
            </label>
          </div>
          
          <button id="process-files" class="btn btn-primary">Update Dashboard</button>
        </div>
        
        <div class="col-md-6">
          <h3 class="h5 mb-3">Uploaded Files</h3>
          <div class="uploaded-files-list p-3 border rounded bg-light" style="max-height: 300px; overflow-y: auto;">
            <div id="no-files-message" class="text-center text-muted py-4">
              <p>No files uploaded yet</p>
            </div>
            <ul id="uploaded-files" class="list-group list-group-flush">
              <!-- Files will be listed here -->
            </ul>
          </div>
        </div>
      </div>
    `;
    
    // Insert before the date filter
    const dateFilter = document.getElementById('date-filter-container');
    if (dateFilter) {
      container.insertBefore(uploadCard, dateFilter);
    } else {
      container.prepend(uploadCard);
    }
    
    // Add Bootstrap Icons stylesheet if needed
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
      const iconStyle = document.createElement('link');
      iconStyle.rel = 'stylesheet';
      iconStyle.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css';
      document.head.appendChild(iconStyle);
    }
    
    // Setup event listeners
    setupUploadListeners();
  };
  
  // Setup upload listeners
  const setupUploadListeners = () => {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-files');
    const processButton = document.getElementById('process-files');
    
    if (!dropzone || !fileInput || !browseButton || !processButton) return;
    
    // Handle file browse button
    browseButton.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
      }
    });
    
    // Handle drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('bg-light');
    });
    
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('bg-light');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('bg-light');
      
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
    
    // Handle process button
    processButton.addEventListener('click', () => {
      processUploadedFiles();
    });
  };
  
  // Handle uploaded files
  const handleFiles = (files) => {
    // Get DOM elements
    const uploadedFilesList = document.getElementById('uploaded-files');
    const noFilesMessage = document.getElementById('no-files-message');
    const autoLoad = document.getElementById('auto-load');
    
    if (!uploadedFilesList || !noFilesMessage) return;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only accept CSV files
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showErrorMessage(`${file.name} is not a CSV file`);
        continue;
      }
      
      // Add to uploaded files
      uploadedFiles[file.name] = file;
      
      // Update UI
      noFilesMessage.style.display = 'none';
      
      // Create list item if it doesn't exist
      let fileItem = document.getElementById(`file-${file.name.replace(/[^a-z0-9]/gi, '-')}`);
      
      if (!fileItem) {
        fileItem = document.createElement('li');
        fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        fileItem.id = `file-${file.name.replace(/[^a-z0-9]/gi, '-')}`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-sm btn-outline-danger';
        removeButton.innerHTML = '<i class="bi bi-trash"></i>';
        removeButton.addEventListener('click', () => {
          // Remove from list and storage
          delete uploadedFiles[file.name];
          fileItem.remove();
          
          // Show no files message if no files left
          if (Object.keys(uploadedFiles).length === 0) {
            noFilesMessage.style.display = 'block';
          }
        });
        
        fileItem.innerHTML = `
          <div>
            <i class="bi bi-file-earmark-text text-primary me-2"></i>
            <span>${file.name}</span>
            <small class="text-muted ms-2">(${formatFileSize(file.size)})</small>
          </div>
        `;
        
        fileItem.appendChild(removeButton);
        uploadedFilesList.appendChild(fileItem);
      }
    }
    
    // Automatically process if auto-load is checked
    if (autoLoad && autoLoad.checked) {
      processUploadedFiles();
    }
  };
  
  // Process uploaded files
  const processUploadedFiles = async () => {
    if (Object.keys(uploadedFiles).length === 0) {
      showErrorMessage('No files to process');
      return;
    }
    
    // Show loader
    showLoader();
    
    try {
      // Process each file
      for (const [filename, file] of Object.entries(uploadedFiles)) {
        await processFile(filename, file);
      }
      
      // Update dashboard
      if (window.dashboardApi && window.dashboardApi.reloadData) {
        window.dashboardApi.reloadData();
      } else {
        // Fallback: reload the page
        location.reload();
      }
      
      showSuccessMessage('Dashboard updated successfully');
    } catch (error) {
      console.error('Error processing files:', error);
      showErrorMessage('Error processing files: ' + error.message);
    } finally {
      hideLoader();
    }
  };
  
  // Process individual file
  const processFile = async (filename, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          
          // In real implementation, we would save the file to the server
          // or process it locally using PapaParse
          
          console.log(`Processing ${filename} (${formatFileSize(file.size)})`);
          
          // Simulate processing delay
          await new Promise(r => setTimeout(r, 500));
          
          // Update file item to show processed
          const fileItem = document.getElementById(`file-${filename.replace(/[^a-z0-9]/gi, '-')}`);
          if (fileItem) {
            const statusBadge = document.createElement('span');
            statusBadge.className = 'badge bg-success ms-2';
            statusBadge.textContent = 'Processed';
            
            const fileInfo = fileItem.querySelector('div');
            if (fileInfo) {
              // Find existing badge if any
              const existingBadge = fileInfo.querySelector('.badge');
              if (existingBadge) {
                existingBadge.remove();
              }
              
              fileInfo.appendChild(statusBadge);
            }
          }
          
          resolve();
        } catch (error) {
          console.error(`Error processing ${filename}:`, error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read ${filename}`));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Show loader
  const showLoader = () => {
    let loader = document.getElementById('dashboard-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'dashboard-loader';
      loader.className = 'loader';
      loader.style.display = 'block';
      document.querySelector('.container').appendChild(loader);
    } else {
      loader.style.display = 'block';
    }
  };
  
  // Hide loader
  const hideLoader = () => {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  };
  
  // Show error message
  const showErrorMessage = (message) => {
    showMessage(message, 'danger');
  };
  
  // Show success message
  const showSuccessMessage = (message) => {
    showMessage(message, 'success');
  };
  
  // Show message
  const showMessage = (message, type = 'info') => {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `alert alert-${type} alert-dismissible fade show`;
    messageElement.role = 'alert';
    messageElement.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(messageElement, container.firstChild);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  };
  
  // Initialize
  const init = () => {
    // Create the upload UI
    createUploadUI();
  };
  
  // Return public methods
  return {
    init,
    getUploadedFiles: () => ({ ...uploadedFiles }),
    processFiles: processUploadedFiles
  };
}

// Initialize the file upload manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for dashboard initialization
  setTimeout(() => {
    const fileUploadManager = createFileUploadManager();
    fileUploadManager.init();
    
    // Expose to window for easy access
    window.fileUploadManager = fileUploadManager;
  }, 1500);
});
