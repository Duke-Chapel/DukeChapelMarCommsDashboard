// Enhanced date filter component with period comparison functionality
function createEnhancedDateFilter() {
  // State tracking for the date filter
  let dateRanges = {
    current: {
      startDate: null,
      endDate: null
    },
    comparison: {
      startDate: null,
      endDate: null,
      enabled: false
    }
  };
  
  // Available dates from the data
  let availableDates = {
    earliestDate: null,
    latestDate: null
  };
  
  // Function to format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };
  
  // Format date for input fields
  const formatDateForInput = (date) => {
    if (!date) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  
  // Create date filter container safely
  const dateFilterContainer = document.createElement('div');
  dateFilterContainer.className = 'dashboard-section mb-4';
  dateFilterContainer.id = 'date-filter-container';
  
  // Set initial dates (last 30 days by default)
  const setDefaultDates = () => {
    if (availableDates.earliestDate && availableDates.latestDate) {
      // Set current period to last 30 days or available range if smaller
      const now = availableDates.latestDate;
      let thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      // Ensure it's not before earliest date
      if (thirtyDaysAgo < availableDates.earliestDate) {
        thirtyDaysAgo = new Date(availableDates.earliestDate);
      }
      
      dateRanges.current.startDate = thirtyDaysAgo;
      dateRanges.current.endDate = now;
      
      // Set comparison period to previous 30 days
      let sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(now.getDate() - 60);
      
      if (sixtyDaysAgo < availableDates.earliestDate) {
        sixtyDaysAgo = new Date(availableDates.earliestDate);
      }
      
      dateRanges.comparison.startDate = sixtyDaysAgo;
      dateRanges.comparison.endDate = new Date(thirtyDaysAgo);
      dateRanges.comparison.endDate.setDate(dateRanges.comparison.endDate.getDate() - 1);
      
      // Disable comparison if there's not enough data for a valid comparison
      if (dateRanges.comparison.startDate >= dateRanges.comparison.endDate) {
        dateRanges.comparison.enabled = false;
      }
    }
  };
  
  // Safely insert the date filter container
  const insertDateFilter = () => {
    const container = document.querySelector('.container');
    if (!container) return; // No container found
    
    // Try to insert before tabs
    const tabsRow = document.querySelector('#dashboardTabs');
    if (tabsRow) {
      const tabParent = tabsRow.closest('.row');
      if (tabParent && tabParent.parentNode === container) {
        container.insertBefore(dateFilterContainer, tabParent);
        return;
      }
    }
    
    // If we couldn't find tabs, try to insert as first child of container
    if (container.firstChild) {
      container.insertBefore(dateFilterContainer, container.firstChild);
    } else {
      container.appendChild(dateFilterContainer);
    }
  };
  
  // Create date filter UI
  const renderDateFilter = () => {
    if (!document.getElementById('date-filter-container')) {
      insertDateFilter();
    }
    
    const filterContainer = document.getElementById('date-filter-container');
    if (!filterContainer) {
      console.warn('Date filter container not found in the DOM');
      return;
    }
    
    filterContainer.innerHTML = `
      <h3 class="h5 mb-3">Date Range Filter</h3>
      <div class="date-filter-controls">
        <div class="row align-items-end mb-3">
          <div class="col-md-12 mb-3">
            <h6 class="current-period-label">Current Period</h6>
          </div>
          <div class="col-md-3">
            <label class="form-label">Start Date</label>
            <input 
              type="date" 
              id="current-start-date" 
              class="form-control" 
              value="${formatDateForInput(dateRanges.current.startDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input 
              type="date" 
              id="current-end-date" 
              class="form-control" 
              value="${formatDateForInput(dateRanges.current.endDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-3">
            <button id="apply-date-filter" class="btn btn-primary">Apply Filter</button>
          </div>
          <div class="col-md-3">
            <button id="clear-date-filter" class="btn btn-secondary">Reset to Default</button>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="enable-comparison" ${dateRanges.comparison.enabled ? 'checked' : ''}>
              <label class="form-check-label" for="enable-comparison">Enable period comparison</label>
            </div>
          </div>
        </div>
        <div id="comparison-period-controls" class="row align-items-end mb-3" ${dateRanges.comparison.enabled ? '' : 'style="display:none"'}>
          <div class="col-md-12 mb-3">
            <h6 class="comparison-period-label">Comparison Period</h6>
          </div>
          <div class="col-md-3">
            <label class="form-label">Start Date</label>
            <input 
              type="date" 
              id="comparison-start-date" 
              class="form-control" 
              value="${formatDateForInput(dateRanges.comparison.startDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input 
              type="date" 
              id="comparison-end-date" 
              class="form-control" 
              value="${formatDateForInput(dateRanges.comparison.endDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-6">
            <div class="btn-group" role="group">
              <button id="previous-period" class="btn btn-outline-secondary">Previous Period</button>
              <button id="same-period-last-year" class="btn btn-outline-secondary">Same Period Last Year</button>
            </div>
          </div>
        </div>
        ${dateRanges.current.startDate && dateRanges.current.endDate ? `
          <div class="alert alert-info">
            <strong>Active Filter:</strong> Showing data for ${formatDateForDisplay(dateRanges.current.startDate)} - ${formatDateForDisplay(dateRanges.current.endDate)}
            ${dateRanges.comparison.enabled ? 
              `<br><strong>Comparing to:</strong> ${formatDateForDisplay(dateRanges.comparison.startDate)} - ${formatDateForDisplay(dateRanges.comparison.endDate)}` 
              : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    // Add event listeners
    const currentStartDate = document.getElementById('current-start-date');
    const currentEndDate = document.getElementById('current-end-date');
    const comparisonStartDate = document.getElementById('comparison-start-date');
    const comparisonEndDate = document.getElementById('comparison-end-date');
    const enableComparisonCheckbox = document.getElementById('enable-comparison');
    const comparisonControls = document.getElementById('comparison-period-controls');
    const applyFilterBtn = document.getElementById('apply-date-filter');
    const clearFilterBtn = document.getElementById('clear-date-filter');
    const previousPeriodBtn = document.getElementById('previous-period');
    const samePeriodLastYearBtn = document.getElementById('same-period-last-year');
    
    if (currentStartDate) {
      currentStartDate.addEventListener('change', (e) => {
        dateRanges.current.startDate = e.target.value ? new Date(e.target.value) : null;
      });
    }
    
    if (currentEndDate) {
      currentEndDate.addEventListener('change', (e) => {
        dateRanges.current.endDate = e.target.value ? new Date(e.target.value) : null;
      });
    }
    
    if (comparisonStartDate) {
      comparisonStartDate.addEventListener('change', (e) => {
        dateRanges.comparison.startDate = e.target.value ? new Date(e.target.value) : null;
      });
    }
    
    if (comparisonEndDate) {
      comparisonEndDate.addEventListener('change', (e) => {
        dateRanges.comparison.endDate = e.target.value ? new Date(e.target.value) : null;
      });
    }
    
    if (enableComparisonCheckbox) {
      enableComparisonCheckbox.addEventListener('change', (e) => {
        dateRanges.comparison.enabled = e.target.checked;
        if (comparisonControls) {
          comparisonControls.style.display = e.target.checked ? 'flex' : 'none';
        }
      });
    }
    
    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', () => {
        // Validate dates before updating
        if (dateRanges.current.startDate > dateRanges.current.endDate) {
          alert('Current period start date must be before end date');
          return;
        }
        
        if (dateRanges.comparison.enabled && 
            dateRanges.comparison.startDate > dateRanges.comparison.endDate) {
          alert('Comparison period start date must be before end date');
          return;
        }
        
        renderDateFilter();
        updateDashboard(dateRanges);
      });
    }
    
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        setDefaultDates();
        renderDateFilter();
        updateDashboard(dateRanges);
      });
    }
    
    if (previousPeriodBtn) {
      previousPeriodBtn.addEventListener('click', () => {
        if (!dateRanges.current.startDate || !dateRanges.current.endDate) return;
        
        // Calculate previous period with the same duration
        const currentDuration = dateRanges.current.endDate - dateRanges.current.startDate;
        const newEndDate = new Date(dateRanges.current.startDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        
        const newStartDate = new Date(newEndDate);
        newStartDate.setTime(newEndDate.getTime() - currentDuration);
        
        // Ensure not before earliest date
        if (newStartDate >= availableDates.earliestDate) {
          dateRanges.comparison.startDate = newStartDate;
          dateRanges.comparison.endDate = newEndDate;
          
          comparisonStartDate.value = formatDateForInput(dateRanges.comparison.startDate);
          comparisonEndDate.value = formatDateForInput(dateRanges.comparison.endDate);
        } else {
          alert("Previous period would be before the earliest available data.");
        }
      });
    }
    
    if (samePeriodLastYearBtn) {
      samePeriodLastYearBtn.addEventListener('click', () => {
        if (!dateRanges.current.startDate || !dateRanges.current.endDate) return;
        
        // Calculate same period last year
        const newStartDate = new Date(dateRanges.current.startDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        
        const newEndDate = new Date(dateRanges.current.endDate);
        newEndDate.setFullYear(newEndDate.getFullYear() - 1);
        
        // Ensure not before earliest date
        if (newStartDate >= availableDates.earliestDate) {
          dateRanges.comparison.startDate = newStartDate;
          dateRanges.comparison.endDate = newEndDate;
          
          comparisonStartDate.value = formatDateForInput(dateRanges.comparison.startDate);
          comparisonEndDate.value = formatDateForInput(dateRanges.comparison.endDate);
        } else {
          alert("Same period last year would be before the earliest available data.");
        }
      });
    }
  };
  
  // Initialize and return the controller
  return {
    setAvailableDates: (earliest, latest) => {
      availableDates.earliestDate = earliest;
      availableDates.latestDate = latest;
      setDefaultDates();
    },
    
    getDateRanges: () => dateRanges,
    
    render: () => {
      renderDateFilter();
    },
    
    getCurrentDateFilter: () => dateRanges
  };
}
