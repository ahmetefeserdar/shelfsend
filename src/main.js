// src/main.js
import "./styles.css";
import { initDrag } from "./drag.js";

// Helper function to format file sizes
function humanSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Basic greeting to prove hot-reload still works
const root = document.getElementById("app");
root.innerHTML = `
  <h1>ShelfSend</h1>
  <p>Drag files anywhere on this window to stage them…</p>
  <button id="clear">Clear</button>
  <ul id="file-list"></ul>
`;

// Implement stageFiles function
async function stageFiles(paths) {
  try {
    const staged = await window.__TAURI__.core.invoke("stage_files", { paths });
    
    // Get file stats for size information
    const fileInfos = await Promise.all(
      paths.map(async (path, index) => {
        const name = path.split(/[/\\]/).pop(); // Get filename from path
        try {
          const stats = await window.__TAURI__.core.invoke("get_file_size", { path });
          return { name, size: humanSize(stats) };
        } catch {
          return { name, size: "Unknown" };
        }
      })
    );

    // Update the list with name + human size
    const list = document.getElementById("file-list");
    list.innerHTML = fileInfos.map(info => 
      `<li>${info.name} (${info.size})</li>`
    ).join("");
  } catch (error) {
    console.error("Failed to stage files:", error);
  }
}

// Add clear button click handler
document.getElementById('clear').onclick = async ()=>{
  await window.__TAURI__.core.invoke('clear_staging');
  document.getElementById('file-list').innerHTML='';
};

// Initialize drag functionality after DOM setup
initDrag(stageFiles);