export function initDrag(onFiles){
  console.log("Initializing drag listeners");
  
  window.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  
  window.addEventListener('drop', e => {
    e.preventDefault();
    console.log("Drop event triggered");
    
    const files = [...e.dataTransfer.files];
    console.log("Files dropped:", files);
    
    if(files.length) {
      // In Tauri, we need to use the file path differently
      const paths = files.map(f => f.path || f.name);
      console.log("File paths:", paths);
      onFiles(paths);
    }
  });
} 