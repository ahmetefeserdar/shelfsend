// src/main.js
import "./styles.css";
import { listen } from '@tauri-apps/api/event';

console.log("Main.js loading...");

// Helper function to format file sizes
function humanSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize the UI
function initUI() {
  console.log("Initializing UI...");
  const root = document.getElementById("app");
  
  if (!root) {
    console.error("Could not find #app element");
    return;
  }
  
  root.innerHTML = `
    <h1>ShelfSend</h1>
    <p>Drag files anywhere on this window to stage them…</p>
    <button id="clear">Clear</button>
    <ul id="file-list"></ul>
  `;

  // Add clear button click handler after the DOM is ready
  const clearBtn = document.getElementById('clear');
  if (clearBtn) {
    clearBtn.onclick = async () => {
      try {
        console.log("Clearing staging...");
        await window.__TAURI__.core.invoke('clear_staging');
        document.getElementById('file-list').innerHTML = '';
        console.log("Staging cleared successfully");
      } catch (error) {
        console.error("Failed to clear staging:", error);
      }
    };
  } else {
    console.error("Could not find clear button");
  }

  // Use Tauri's native file drop events
  setupTauriFileDrop();
  console.log("UI initialization complete");
}

// Setup Tauri's native file drop events
async function setupTauriFileDrop() {
  try {
    console.log("Setting up Tauri file drop listener...");
    
    // Listen for file drop events
    await listen('tauri://file-drop', (event) => {
      console.log("Tauri file drop event:", event);
      const paths = event.payload;
      if (paths && paths.length > 0) {
        stageFiles(paths);
      }
    });

    // Also keep the web-based drag and drop as fallback
    window.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    window.addEventListener('drop', e => {
      e.preventDefault();
      console.log("Web drop event triggered");
      
      const files = [...e.dataTransfer.files];
      console.log("Files dropped:", files);
      
      if(files.length) {
        // Try to get file paths from the web API
        const paths = files.map(f => f.path || f.webkitRelativePath || f.name);
        console.log("File paths:", paths);
        stageFiles(paths);
      }
    });
    
    console.log("File drop listeners set up successfully");
  } catch (error) {
    console.error("Failed to setup Tauri file drop:", error);
    console.log("Falling back to web-based drag and drop only");
  }
}

// Implement stageFiles function
async function stageFiles(paths) {
  console.log("Stage files called with:", paths);
  try {
    const staged = await window.__TAURI__.core.invoke("stage_files", { paths });
    console.log("Staged files:", staged);
    
    // Create file info objects with original names
    const fileInfos = paths.map((path, index) => {
      const name = path.split(/[/\\]/).pop(); // Get filename from original path
      return { 
        name, 
        size: "Loading...", 
        stagedPath: staged[index] // Use the staged file path for getting size
      };
    });

    // Update the list with name
    const list = document.getElementById("file-list");
    if (list) {
      list.innerHTML = fileInfos.map(info => 
        `<li>${info.name} (${info.size})</li>`
      ).join("");
      
      // Now try to get file sizes from the staged files
      for (let i = 0; i < fileInfos.length; i++) {
        try {
          // Use the staged file path instead of original path
          const stats = await window.__TAURI__.core.invoke("get_file_size", { 
            path: fileInfos[i].stagedPath 
          });
          fileInfos[i].size = humanSize(stats);
          list.innerHTML = fileInfos.map(info => 
            `<li>${info.name} (${info.size})</li>`
          ).join("");
        } catch (error) {
          console.error("Failed to get file size for", fileInfos[i].stagedPath, error);
          fileInfos[i].size = "Unknown";
          list.innerHTML = fileInfos.map(info => 
            `<li>${info.name} (${info.size})</li>`
          ).join("");
        }
      }
    } else {
      console.error("Could not find file-list element");
    }
  } catch (error) {
    console.error("Failed to stage files:", error);
  }
}

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}