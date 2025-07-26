// src/main.js
import "./styles.css";
import { initDrag } from "./drag.js";

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

  // Initialize drag functionality after DOM setup
  initDrag(stageFiles);
  console.log("UI initialization complete");
}

// Implement stageFiles function
async function stageFiles(paths) {
  console.log("Stage files called with:", paths);
  try {
    const staged = await window.__TAURI__.core.invoke("stage_files", { paths });
    console.log("Staged files:", staged);
    
    // For now, let's just display the filenames without trying to get file sizes
    // to isolate any issues with the get_file_size command
    const fileInfos = paths.map(path => {
      const name = path.split(/[/\\]/).pop(); // Get filename from path
      return { name, size: "Loading..." };
    });

    // Update the list with name
    const list = document.getElementById("file-list");
    if (list) {
      list.innerHTML = fileInfos.map(info => 
        `<li>${info.name} (${info.size})</li>`
      ).join("");
      
      // Now try to get file sizes asynchronously
      for (let i = 0; i < paths.length; i++) {
        try {
          const stats = await window.__TAURI__.core.invoke("get_file_size", { path: paths[i] });
          fileInfos[i].size = humanSize(stats);
          list.innerHTML = fileInfos.map(info => 
            `<li>${info.name} (${info.size})</li>`
          ).join("");
        } catch (error) {
          console.error("Failed to get file size for", paths[i], error);
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