const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browse');
const fileList = document.getElementById('fileList');
const conversionOptions = document.getElementById('conversion-options');
const outputOptions = document.getElementById('outputOptions');
const convertBtn = document.getElementById('convertBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const toast = document.getElementById('toast');
const downloadLink = document.getElementById('downloadLink');

let uploadedFiles = [];
let token = "";
let outputExts = [];
let selectedExt = "";

function showToast(msg, error=false) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toast.classList.toggle("bg-[#FFB703]", !error);
  toast.classList.toggle("bg-red-600", error);
  setTimeout(() => toast.classList.add("hidden"), 4000);
}

function updateFileList(files) {
  fileList.innerHTML = files.map(f => `<span class="inline-block bg-[#219ebc] text-white px-2 py-1 rounded mr-2 mb-1">${f.name}</span>`).join('');
}

function setProgress(percent) {
  progressBar.style.width = percent + "%";
  progressPercent.textContent = percent + "%";
}

function resetUI() {
  conversionOptions.classList.add('hidden');
  convertBtn.classList.add('hidden');
  progress.classList.add('hidden');
  downloadLink.innerHTML = '';
  selectedExt = "";
}

dropzone.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add("bg-blue-50"); });
dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove("bg-blue-50"); });
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove("bg-blue-50");
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
  resetUI();
  if (!files.length) return;
  uploadedFiles = Array.from(files);
  updateFileList(uploadedFiles);
  let formData = new FormData();
  uploadedFiles.forEach(f => formData.append("files[]", f));
  fetch('/api/upload', {method: "POST", body: formData})
    .then(r => r.json())
    .then(resp => {
      if (resp.error) return showToast(resp.error, true);
      token = resp.token;
      outputExts = resp.suggested_outputs;
      showOutputOptions(outputExts);
    }).catch(() => showToast("Upload failed", true));
}

function showOutputOptions(exts) {
  outputOptions.innerHTML = "";
  exts.forEach(ext => {
    let btn = document.createElement("button");
    btn.textContent = ext;
    btn.className = "bg-[#FB8500] text-white px-3 py-1 rounded hover:bg-[#FFB703]";
    btn.onclick = () => {
      selectedExt = ext;
      Array.from(outputOptions.children).forEach(child => child.classList.remove("ring", "ring-2", "ring-[#023047]"));
      btn.classList.add("ring", "ring-2", "ring-[#023047]");
      convertBtn.classList.remove('hidden');
    };
    outputOptions.appendChild(btn);
  });
  conversionOptions.classList.remove('hidden');
}

convertBtn.addEventListener('click', () => {
  if (!selectedExt) return showToast("Please select a conversion format", true);
  progress.classList.remove('hidden');
  setProgress(10);
  fetch('/api/convert', {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({token, output_ext: selectedExt})
  })
  .then(res => res.json())
  .then(resp => {
    setProgress(90);
    if (resp.error) return showToast(resp.error, true);
    // Show download
    downloadLink.innerHTML = `<a href="${resp.download_url}" download="${resp.file_name}" class="bg-[#8ecae6] text-[#023047] px-4 py-2 rounded font-bold">Download ${resp.file_name}</a>`;
    setProgress(100);
    showToast("Conversion ready!", false);
  })
  .catch(() => { showToast("Conversion failed", true); progress.classList.add('hidden'); });
});
