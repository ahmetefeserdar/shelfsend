export function initDrag(onFiles){
  window.addEventListener('dragover', e=>e.preventDefault());
  window.addEventListener('drop', e=>{e.preventDefault();
    const files=[...e.dataTransfer.files];
    if(files.length) onFiles(files.map(f=>f.path));
  });
} 