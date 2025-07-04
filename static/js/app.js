// MyShapeCreator JavaScript – handles navigation, drawing tools, quiz logic

/* ===== Helper Utilities ===== */
const $ = (selector, all = false) => all ? document.querySelectorAll(selector) : document.querySelector(selector);

/* ===== Section Navigation ===== */
function setActiveSection(id) {
  $('.section.active')?.classList.remove('active');
  $(`#${id}`).classList.add('active');
  $('.nav__link.active')?.classList.remove('active');
  $(`.nav__link[data-section="${id}"]`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

[...$('.nav__link', true)].forEach(link => link.addEventListener('click', e => {
  e.preventDefault();
  setActiveSection(link.dataset.section);
}));

[...$('.hero__actions .btn', true)].forEach(btn => btn.addEventListener('click', () => setActiveSection(btn.dataset.section)));
[...$('.feature-card', true)].forEach(card => card.addEventListener('click', () => setActiveSection(card.dataset.section)));

/* ===== Drawing Canvas ===== */
const canvas = $('#drawingCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let currentTool = 'brush';
let brushColor = $('#colorPicker').value;
let brushSize = $('#brushSize').value;
let gridEnabled = false;
let history = [];
let historyStep = -1;

function saveState() {
  history = history.slice(0, historyStep + 1);
  history.push(canvas.toDataURL());
  historyStep++;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gridEnabled) drawGrid();
}

function drawGrid() {
  const spacing = 25;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();
}

function setBrushAttributes() {
  ctx.lineCap = 'round';
  ctx.strokeStyle = brushColor;
  ctx.fillStyle = brushColor;
  ctx.lineWidth = brushSize;
}

// Initialise canvas
setBrushAttributes();
ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); saveState();

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  drawing = true; ctx.beginPath(); ctx.moveTo(x, y);
});
canvas.addEventListener('mousemove', (e) => {
  if (!drawing || currentTool !== 'brush') return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
});
['mouseup', 'mouseleave'].forEach(ev => canvas.addEventListener(ev, () => { if (drawing) { drawing = false; saveState(); } }));

[...$('.tool-btn', true)].forEach(btn => btn.addEventListener('click', () => {
  $('.tool-btn.active')?.classList.remove('active'); btn.classList.add('active'); currentTool = btn.dataset.tool;
}));
$('#colorPicker').addEventListener('input', e => { brushColor = e.target.value; setBrushAttributes(); });
$('#brushSize').addEventListener('input', e => { brushSize = e.target.value; $('#brushSizeValue').textContent = `${brushSize}px`; setBrushAttributes(); });
$('#gridToggle').addEventListener('click', () => { gridEnabled = !gridEnabled; clearCanvas(); saveState(); });
$('#clearCanvas').addEventListener('click', () => { clearCanvas(); saveState(); });
function restore(step) { const img = new Image(); img.src = history[step]; img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); if (gridEnabled) drawGrid(); }; }
$('#undoAction').addEventListener('click', () => { if (historyStep>0) { historyStep--; restore(historyStep);} });
$('#redoAction').addEventListener('click', () => { if (historyStep < history.length-1) { historyStep++; restore(historyStep);} });
$('#saveDrawing').addEventListener('click', () => { const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download='myshapecreator_drawing.png'; a.click(); });

/* ===== Quiz Logic ===== */
const quizData = [
  { question: 'How many sides does a hexagon have?', options: ['5','6','7','8'], answer:1 },
  { question: 'Which shape has equal length and width?', options: ['Rectangle','Square','Triangle','Circle'], answer:1 },
  { question: 'A three-sided polygon is called a…', options:['Pentagon','Hexagon','Triangle','Octagon'], answer:2 },
  { question: 'The center point of a circle is the…', options:['Focus','Nucleus','Origin','Center'], answer:3 },
  { question: 'Which of these is NOT a polygon?', options:['Triangle','Circle','Pentagon','Quadrilateral'], answer:1 }
];
let currentQuestion=0, score=0, selectedOption=null, timer=null, timeLeft=30;
function startQuiz(){currentQuestion=0;score=0;$('#quizResults').style.display='none';$('#questionCard').style.display='block';loadQuestion();updateProgress();resetTimer();}
function loadQuestion(){ const q=quizData[currentQuestion]; $('#questionText').textContent=q.question; const optC=$('#questionOptions'); optC.innerHTML=''; q.options.forEach((o,i)=>{const div=document.createElement('div');div.className='option';div.textContent=o;div.addEventListener('click',()=>selectOption(i,div));optC.appendChild(div);} ); $('#questionFeedback').className='question-feedback'; $('#submitAnswer').disabled=true; $('#nextQuestion').style.display='none'; selectedOption=null; }
function selectOption(i,el){ if($('#nextQuestion').style.display!=='none')return; [...$('.option',true)].forEach(o=>o.classList.remove('selected')); el.classList.add('selected'); selectedOption=i; $('#submitAnswer').disabled=false; }
function evaluateAnswer(){ const q=quizData[currentQuestion]; const opts=[...$('.option',true)]; opts.forEach((el,i)=>{ if(i===q.answer) el.classList.add('correct'); if(i===selectedOption && i!==q.answer) el.classList.add('incorrect'); el.classList.remove('selected'); }); const fb=$('#questionFeedback'); fb.classList.add('show'); if(selectedOption===q.answer){ fb.textContent='Correct! Well done.'; fb.classList.add('correct'); score++; }else{ fb.textContent='Oops! That is incorrect.'; fb.classList.add('incorrect'); }
 $('#submitAnswer').disabled=true; stopTimer();
 if(currentQuestion===quizData.length-1){ // last question -> show results automatically
   setTimeout(showResults, 1200);
 }else{
   $('#nextQuestion').style.display='inline-flex';
 }
}
function nextQuestion(){ currentQuestion++; loadQuestion(); updateProgress(); resetTimer(); }
function updateProgress(){ $('#quizProgress').style.width=`${(currentQuestion/quizData.length)*100}%`; $('#questionCounter').textContent=`Question ${currentQuestion+1} of ${quizData.length}`; }
function showResults(){ $('#questionCard').style.display='none'; $('#quizResults').style.display='block'; $('#finalScore').textContent=`${Math.round((score/quizData.length)*100)}%`; $('#correctAnswers').textContent=`${score}/${quizData.length}`; $('#quizProgress').style.width='100%'; stopTimer(); }
function resetTimer(){ stopTimer(); timeLeft=30; $('#timer').textContent=`Time: 00:${String(timeLeft).padStart(2,'0')}`; timer=setInterval(()=>{ timeLeft--; $('#timer').textContent=`Time: 00:${String(timeLeft).padStart(2,'0')}`; if(timeLeft<=0){ evaluateAnswer(); } },1000); }
function stopTimer(){ clearInterval(timer); }
$('#submitAnswer').addEventListener('click',evaluateAnswer); $('#nextQuestion').addEventListener('click',nextQuestion); $('#retakeQuiz').addEventListener('click',startQuiz);
const observer=new MutationObserver(()=>{ if($('#quiz').classList.contains('active')){ startQuiz(); } else { stopTimer(); } }); observer.observe($('#quiz'),{attributes:true,attributeFilter:['class']});

/* ===== Gallery Filter/Search ===== */
function filterGallery(){ const q=$('#gallerySearch').value.toLowerCase(); const f=$('#galleryFilter').value; [...$('#galleryGrid').children].forEach(item=>{ const title=item.querySelector('h4').textContent.toLowerCase(); let visible=title.includes(q); if(f==='recent' && !title.includes('circle') && !title.includes('geometric')) visible=false; if(f==='favorites' && !title.includes('triangle')) visible=false; if(f==='shapes' && !title.includes('geometric')) visible=false; item.style.display=visible?'block':'none'; }); }
$('#gallerySearch').addEventListener('input',filterGallery); $('#galleryFilter').addEventListener('change',filterGallery);

/* ===== Initialize ===== */
setActiveSection('home');