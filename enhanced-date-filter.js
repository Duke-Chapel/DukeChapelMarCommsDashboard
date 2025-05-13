// Enhanced date filter component with period comparison functionality - UPDATED VERSION
function createEnhancedDateFilter(updateCallback) {
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
  
  // Store the update callback
  const updateDashboard = updateCallback || function() {
    console.warn('No update callback provided to date filter');
  };
  
  // Function to format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date for display:', e);
      return '';
    }
  };
  
  // Format date for input fields
  const formatDateForInput = (date) => {
    if (!date) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date for input:', e);
      return '';
    }
  };
  
  // Create date filter container safely
  const createFilterContainer = () => {
    console.log('Creating date filter container');
    let dateFilterContainer = document.getElementById('date-filter-container');
    
    if (!dateFilterContainer) {
      dateFilterContainer = document.createElement('div');
      dateFilterContainer.className = 'dashboard-section mb-4';
      dateFilterContainer.id = 'date-filter-container';
      
      // Insert in the appropriate place in the DOM
      const container = document.querySelector('.container');
      if (!container) {
        console.error('Container element not found for date filter');
        return dateFilterContainer;
      }
      
      // Try to insert before tabs
      const tabsRow = document.querySelector('#dashboardTabs');
      if (tabsRow) {
        const tabParent = tabsRow.closest('.row');
        if (tabParent && tabParent.parentNode === container) {
          container.insertBefore(dateFilterContainer, tabParent);
        } else {
          // Insert as first child
          if (container.firstChild) {
            container.insertBefore(dateFilterContainer, container.firstChild);
          } else {
            container.appendChild(dateFilterContainer);
          }
        }
      } else {
        // Insert as first child
        if (container.firstChild) {
          container.insertBefore(dateFilterContainer, container.firstChild);
        } else {
          container.appendChild(dateFilterContainer);
        }
      }
    }
    
    return dateFilterContainer;
  };
  
  // FIXED: Set initial dates with better validation and logging
  const setDefaultDates = () => {
    console.log('Setting default dates...');
    console.log('Available date range:', availableDates);
    
    if (availableDates.earliestDate && availableDates.latestDate) {
      // Convert to proper Date objects if they're not already
      const earliestDate = availableDates.earliestDate instanceof Date ? 
                         availableDates.earliestDate : new Date(availableDates.earliestDate);
      
      const latestDate = availableDates.latestDate instanceof Date ? 
                       availableDates.latestDate : new Date(availableDates.latestDate);
      
      console.log(`Setting default dates with range: ${earliestDate.toISOString()} to ${latestDate.toISOString()}`);
      
      // Get current date for default end date if latest available date is too old
      const now = new Date();
      
      // Use the most recent date between now and the latest available date
      const endDate = latestDate > now ? now : new Date(latestDate);
      
      // Set current period to last 30 days or available range if smaller
      let thirtyDaysAgo = new Date(endDate);
      thirtyDaysAgo.setDate(endDate.getDate() - 30);
      
      // Ensure it's not before earliest date
      if (thirtyDaysAgo < earliestDate) {
        thirtyDaysAgo = new Date(earliestDate);
        console.log('Adjusted start date to earliest available:', thirtyDaysAgo.toISOString());
      }
      
      dateRanges.current.startDate = thirtyDaysAgo;
      dateRanges.current.endDate = endDate;
      
      // Set comparison period to previous 30 days
      let sixtyDaysAgo = new Date(endDate);
      sixtyDaysAgo.setDate(endDate.getDate() - 60);
      
      if (sixtyDaysAgo < earliestDate) {
        sixtyDaysAgo = new Date(earliestDate);
        console.log('Adjusted comparison start date to earliest available:', sixtyDaysAgo.toISOString());
      }
      
      dateRanges.comparison.startDate = sixtyDaysAgo;
      dateRanges.comparison.endDate = new Date(thirtyDaysAgo);
      dateRanges.comparison.endDate.setDate(dateRanges.comparison.endDate.getDate() - 1);
      
      // Disable comparison if there's not enough data for a valid comparison
      if (dateRanges.comparison.startDate >= dateRanges.comparison.endDate) {
        console.log('Disabling comparison due to insufficient date range');
        dateRanges.comparison.enabled = false;
      } else {
        dateRanges.comparison.enabled = true;
      }
      
      console.log('Date ranges set to:', 
                  `Current: ${dateRanges.current.startDate.toISOString()} to ${dateRanges.current.endDate.toISOString()}`,
                  `Comparison: ${dateRanges.comparison.startDate.toISOString()} to ${dateRanges.comparison.endDate.toISOString()}`);
    } else {
      console.warn('Cannot set default dates - available date range is invalid');
      // Use fallback dates
      const now = new Date();
      dateRanges.current.endDate = now;
      
      let thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      dateRanges.current.startDate = thirtyDaysAgo;
      
      // Set comparison to previous 30 days
      let sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(now.getDate() - 60);
      dateRanges.comparison.startDate = sixtyDaysAgo;
      
      let thirtyOneDaysAgo = new Date(now);
      thirtyOneDaysAgo.setDate(now.getDate() - 31);
      dateRanges.comparison.endDate = thirtyOneDaysAgo;
      
      dateRanges.comparison.enabled = false;
      
      console.log('Using fallback date ranges:', 
                  `Current: ${dateRanges.current.startDate.toISOString()} to ${dateRanges.current.endDate.toISOString()}`,
                  `Comparison: ${dateRanges.comparison.startDate.toISOString()} to ${dateRanges.comparison.endDate.toISOString()}`);
    }
  };
  
  // Allow for manual date range override (useful for testing)
  const setManualDateRange = (startDate, endDate, comparisonEnabled = false, comparisonStartDate = null, comparisonEndDate = null) => {
    dateRanges.current.startDate = startDate ? new Date(startDate) : null;
    dateRanges.current.endDate = endDate ? new Date(endDate) : null;
    dateRanges.comparison.enabled = comparisonEnabled;
    
    if (comparisonEnabled) {
      dateRanges.comparison.startDate = comparisonStartDate ? new Date(comparisonStartDate) : null;
      dateRanges.comparison.endDate = comparisonEndDate ? new Date(comparisonEndDate) : null;
    }
  };
  
  // FIXED: Create date filter UI with better error handling
  const renderDateFilter = () => {
    console.log('Rendering date filter...');
    
    // Create or get the container
    const filterContainer = createFilterContainer();
    if (!filterContainer) {
      console.error('Failed to create or find date filter container');
      return;
    }
    
    // Ensure dates are valid before rendering
    if (!dateRanges.current.startDate || !dateRanges.current.endDate) {
      console.warn('Current date range not set, using defaults');
      setDefaultDates();
    }
    
    // Format dates for display, with fallbacks
    const currentStartFormatted = formatDateForInput(dateRanges.current.startDate) || '';
    const currentEndFormatted = formatDateForInput(dateRanges.current.endDate) || '';
    const compStartFormatted = formatDateForInput(dateRanges.comparison.startDate) || '';
    const compEndFormatted = formatDateForInput(dateRanges.comparison.endDate) || '';
    const earliestFormatted = formatDateForInput(availableDates.earliestDate) || '';
    const latestFormatted = formatDateForInput(availableDates.latestDate) || '';
    
    console.log('Formatted date values for inputs:', {
      currentStart: currentStartFormatted,
      currentEnd: currentEndFormatted,
      compStart: compStartFormatted,
      compEnd: compEndFormatted,
      earliest: earliestFormatted,
      latest: latestFormatted
    });
    
    // Build the HTML
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
              value="${currentStartFormatted}"
              min="${earliestFormatted}"
              max="${latestFormatted}"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input 
              type="date" 
              id="current-end-date" 
              class="form-control" 
              value="${currentEndFormatted}"
              min="${earliestFormatted}"
              max="${latestFormatted}"
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
              value="${compStartFormatted}"
              min="${earliestFormatted}"
              max="${latestFormatted}"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input 
              type="date" 
              id="comparison-end-date" 
              class="form-control" 
              value="${compEndFormatted}"
              min="${earliestFormatted}"
              max="${latestFormatted}"
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
        ` : `
          <div class="alert alert-warning">
            <strong>Warning:</strong> Date range not properly set. Please select valid dates.
          </div>
        `}
      </div>
    `;
    
    // Add event listeners
    try {
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
          try {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            console.log(`Current start date changed to: ${newDate ? newDate.toISOString() : 'null'}`);
            dateRanges.current.startDate = newDate;
          } catch (err) {
            console.error('Error setting current start date:', err);
          }
        });
      } else {
        console.warn('Current start date input not found');
      }
      
      if (currentEndDate) {
        currentEndDate.addEventListener('change', (e) => {
          try {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            console.log(`Current end date changed to: ${newDate ? newDate.toISOString() : 'null'}`);
            dateRanges.current.endDate = newDate;
          } catch (err) {
            console.error('Error setting current end date:', err);
          }
        });
      } else {
        console.warn('Current end date input not found');
      }
      
      if (comparisonStartDate) {
        comparisonStartDate.addEventListener('change', (e) => {
          try {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            console.log(`Comparison start date changed to: ${newDate ? newDate.toISOString() : 'null'}`);
            dateRanges.comparison.startDate = newDate;
          } catch (err) {
            console.error('Error setting comparison start date:', err);
          }
        });
      } else {
        console.warn('Comparison start date input not found');
      }
      
      if (comparisonEndDate) {
        comparisonEndDate.addEventListener('change', (e) => {
          try {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            console.log(`Comparison end date changed to: ${newDate ? newDate.toISOString() : 'null'}`);
            dateRanges.comparison.endDate = newDate;
          } catch (err) {
            console.error('Error setting comparison end date:', err);
          }
        });
      } else {
        console.warn('Comparison end date input not found');
      }
      
      if (enableComparisonCheckbox) {
        enableComparisonCheckbox.addEventListener('change', (e) => {
          try {
            dateRanges.comparison.enabled = e.target.checked;
            console.log(`Comparison ${e.target.checked ? 'enabled' : 'disabled'}`);
            
            if (comparisonControls) {
              comparisonControls.style.display = e.target.checked ? 'flex' : 'none';
            }
          } catch (err) {
            console.error('Error toggling comparison:', err);
          }
        });
      } else {
        console.warn('Enable comparison checkbox not found');
      }
      
      if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
          try {
            console.log('Apply filter button clicked');
            
            // Validate dates before updating
            if (!dateRanges.current.startDate || !dateRanges.current.endDate) {
              alert('Please select both start and end dates for the current period');
              return;
            }
            
            if (dateRanges.current.startDate > dateRanges.current.endDate) {
              alert('Current period start date must be before end date');
              return;
            }
            
            if (dateRanges.comparison.enabled) {
              if (!dateRanges.comparison.startDate || !dateRanges.comparison.endDate) {
                alert('Please select both start and end dates for the comparison period');
                return;
              }
              
              if (dateRanges.comparison.startDate > dateRanges.comparison.endDate) {
                alert('Comparison period start date must be before end date');
                return;
              }
            }
            
            // Re-render to update the display
            renderDateFilter();
            
            // Call the update callback
            console.log('Calling update dashboard with:', dateRanges);
            updateDashboard(dateRanges);
          } catch (err) {
            console.error('Error applying filter:', err);
            alert('An error occurred while applying the filter. Please try again.');
          }
        });
      } else {
        console.warn('Apply filter button not found');
      }
      
      if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
          try {
            console.log('Reset to default button clicked');
            setDefaultDates();
            renderDateFilter();
            updateDashboard(dateRanges);
          } catch (err) {
            console.error('Error resetting to default dates:', err);
            alert('An error occurred while resetting dates. Please try again.');
          }
        });
      } else {
        console.warn('Reset to default button not found');
      }
      
      if (previousPeriodBtn) {
        previousPeriodBtn.addEventListener('click', () => {
          try {
            console.log('Previous period button clicked');
            
            if (!dateRanges.current.startDate || !dateRanges.current.endDate) {
              alert('Please set the current period dates first');
              return;
            }
            
            // Calculate previous period with the same duration
            const currentDuration = dateRanges.current.endDate - dateRanges.current.startDate;
            const newEndDate = new Date(dateRanges.current.startDate);
            newEndDate.setDate(newEndDate.getDate() - 1);
            
            const newStartDate = new Date(newEndDate);
            newStartDate.setTime(newEndDate.getTime() - currentDuration);
            
            console.log(`Calculated previous period: ${newStartDate.toISOString()} to ${newEndDate.toISOString()}`);
            
            // Ensure not before earliest date
            if (availableDates.earliestDate && newStartDate < availableDates.earliestDate) {
              alert("Previous period would be before the earliest available data.");
              return;
            }
            
            dateRanges.comparison.startDate = newStartDate;
            dateRanges.comparison.endDate = newEndDate;
            
            // Update inputs
            if (comparisonStartDate) comparisonStartDate.value = formatDateForInput(dateRanges.comparison.startDate);
            if (comparisonEndDate) comparisonEndDate.value = formatDateForInput(dateRanges.comparison.endDate);
          } catch (err) {
            console.error('Error setting previous period:', err);
            alert('An error occurred while setting the previous period. Please try again.');
          }
        });
      } else {
        console.warn('Previous period button not found');
      }
      
      if (samePeriodLastYearBtn) {
        samePeriodLastYearBtn.addEventListener('click', () => {
          try {
            console.log('Same period last year button clicked');
            
            if (!dateRanges.current.startDate || !dateRanges.current.endDate) {
              alert('Please set the current period dates first');
              return;
            }
            
            // Calculate same period last year
            const newStartDate = new Date(dateRanges.current.startDate);
            newStartDate.setFullYear(newStartDate.getFullYear() - 1);
            
            const newEndDate = new Date(dateRanges.current.endDate);
            newEndDate.setFullYear(newEndDate.getFullYear() - 1);
            
            console.log(`Calculated same period last year: ${newStartDate.toISOString()} to ${newEndDate.toISOString()}`);
            
            // Ensure not before earliest date
            if (availableDates.earliestDate && newStartDate < availableDates.earliestDate) {
              alert("Same period last year would be before the earliest available data.");
              return;
            }
            
            dateRanges.comparison.startDate = newStartDate;
            dateRanges.comparison.endDate = newEndDate;
            
            // Update inputs
            if (comparisonStartDate) comparisonStartDate.value = formatDateForInput(dateRanges.comparison.startDate);
            if (comparisonEndDate) comparisonEndDate.value = formatDateForInput(dateRanges.comparison.endDate);
          } catch (err) {
            console.error('Error setting same period last year:', err);
            alert('An error occurred while setting the same period last year. Please try again.');
          }
        });
      } else {
        console.warn('Same period last year button not found');
      }
      
      console.log('Successfully set up date filter event listeners');
    } catch (error) {
      console.error('Error setting up date filter event listeners:', error);
    }
  };
  
  // Initialize and return the controller
  return {
    setAvailableDates: (earliest, latest) => {
      console.log(`Setting available dates: ${earliest} to ${latest}`);
      
      // Convert to Date objects if needed
      availableDates.earliestDate = earliest instanceof Date ? earliest : new Date(earliest);
      availableDates.latestDate = latest instanceof Date ? latest : new Date(latest);
      
      // Initialize default date ranges
      setDefaultDates();
    },
    
    getDateRanges: () => dateRanges,
    
    render: () => {
      renderDateFilter();
    },
    
    getCurrentDateFilter: () => dateRanges,
    
    setManualDateRange
  };
}