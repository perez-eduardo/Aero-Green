const airports = [
  {code:'VNY', name:'Van Nuys', fit:['heavy'], role:'Close-in primary FBO', fact:'8,000-ft main runway · 4 FBOs', drive:'35–50 min', type:'close'},
  {code:'ONT', name:'Ontario', fit:['heavy'], role:'Large-aircraft overflow', fact:'12,200-ft runway · 1,741 acres', drive:'65–90 min', type:'overflow'},
  {code:'LAX', name:'Los Angeles International', fit:['heavy'], role:'Limited backup option', fact:'Runways up to 12,090 ft', drive:'20–35 min', type:'overflow'}
];

const sizeLabels = {heavy:'Heavy business jet'};
const focusAirportCodes = ['VNY','LAX','ONT'];
const costBreakdowns = {
  VNY:{landing:'$538*',parking:'$3,600†',hangar:'$8,400†',fuel:'$9,080†',staff:'$2,100†',security:'$50*',transport:'$1,250†',event:'Quote†'},
  LAX:{landing:'$655*',parking:'$5,200†',hangar:'$10,500†',fuel:'$9,080†',staff:'$2,800†',security:'Quote†',transport:'$1,600†',event:'Quote†'},
  ONT:{landing:'$176*',parking:'$68*',hangar:'$6,800†',fuel:'$9,080†',staff:'$2,300†',security:'Quote†',transport:'$3,200†',event:'Quote†'}
};
const matchReasons = {heavy:'Runway length, ramp capacity, and FBO services are screened for heavy business-jet operations.'};
let activeRequest = null;
let requestSequence = 1049;

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function formatRequestDate(date,time){
  if(!date) return 'Pending';
  const parsed=new Date(`${date}T${time||'00:00'}`);
  if(Number.isNaN(parsed.getTime())) return `${date} · ${time||'time pending'}`;
  return `${parsed.toLocaleDateString('en-US',{weekday:'short',month:'2-digit',day:'2-digit'})} · ${time||'time pending'}`;
}

function setText(id,value){
  const element=document.getElementById(id);
  if(element) element.textContent=value;
}

function openModal({eyebrow='AeroGreen',title,content,action='Done'}){
  setText('modal-eyebrow',eyebrow);
  setText('modal-title',title);
  const contentElement=document.getElementById('modal-content');
  contentElement.innerHTML=content;
  setText('modal-action',action);
  document.getElementById('site-modal').classList.remove('hidden');
}

function closeModal(){
  document.getElementById('site-modal').classList.add('hidden');
}

function updateTimeline(stage){
  document.querySelectorAll('#customer-live .timeline-item').forEach((item,index)=>{
    item.classList.toggle('complete',index<stage);
    item.classList.toggle('active',index===stage);
    const marker=item.querySelector('span');
    if(marker) marker.textContent=index<stage?'✓':String(index+1).padStart(2,'0');
    const time=item.querySelector('time');
    if(time) time.textContent=index<stage?'Complete':index===stage?'In progress':'Pending';
  });
}

function setRequestState({status,stage=1,flightStatus='Awaiting flight details',eta='Pending FBO review',note='The FBO keeps final authority.'}){
  setText('live-booking-status',status);
  setText('live-aircraft-status',status);
  setText('live-flight-status',flightStatus);
  setText('live-eta',eta);
  setText('staff-request-status',status);
  setText('staff-flight-status',flightStatus);
  setText('staff-flight-eta',eta);
  setText('staff-request-note',note);
  updateTimeline(stage);
}

function syncRequestToStaff(airportCode){
  if(!activeRequest) return;
  const airport=airports.find(item=>item.code===airportCode) || airports[0];
  setText('staff-active-request',`${activeRequest.id} · ${activeRequest.model}`);
  setText('staff-request-airport',`${airport.code} · ${airport.code==='VNY'?'primary FBO':'backup option'}`);
  setText('staff-flight-detail',`${activeRequest.model} · ${activeRequest.registration||'registration pending'} · ${activeRequest.arrivalDate}`);
  const rows=document.getElementById('request-rows');
  if(!rows) return;
  const existing=rows.querySelector('[data-request-row="active"]');
  if(existing) existing.remove();
  const row=document.createElement('tr');
  row.dataset.requestRow='active';
  row.innerHTML=`<td><strong>${activeRequest.id}</strong><small>${escapeHtml(activeRequest.operationLabel)}</small></td><td>${escapeHtml(activeRequest.model)}<small>${escapeHtml(activeRequest.registration||'Registration pending')} · ${activeRequest.guestCount} people</small></td><td><strong>${airport.code}</strong><small>${airport.code==='VNY'?'Primary FBO':'Backup review'}</small></td><td>${formatRequestDate(activeRequest.arrivalDate,activeRequest.arrivalTime)}<small>Departure ${formatRequestDate(activeRequest.departureDate,activeRequest.departureTime)}</small></td><td><span class="status-chip review" id="active-request-chip">Review</span></td>`;
  rows.prepend(row);
}

function beginRequest(airportCode){
  const operation=document.getElementById('operation-type').value;
  const operationLabel=document.getElementById('operation-type').selectedOptions[0].textContent;
  activeRequest={
    id:`AG-${requestSequence++}`,
    airportCode,
    model:document.getElementById('aircraft-model').value.trim()||'Heavy business jet',
    registration:document.getElementById('registration').value.trim(),
    arrivalDate:document.getElementById('arrival-date').value,
    arrivalTime:document.getElementById('arrival-time').value,
    departureDate:document.getElementById('departure-date').value,
    departureTime:document.getElementById('departure-time').value,
    guestCount:Number(document.getElementById('passengers').value||0)+Number(document.getElementById('crew').value||0),
    operationLabel
  };
  setText('live-request-id',activeRequest.id);
  setText('live-departure',formatRequestDate(activeRequest.departureDate,activeRequest.departureTime));
  document.getElementById('customer-live').classList.remove('hidden');
  syncRequestToStaff(airportCode);
  setRequestState({status:'Under FBO review',stage:1,flightStatus:'Request received · ETA not verified',eta:formatRequestDate(activeRequest.arrivalDate,activeRequest.arrivalTime),note:'AeroGreen sent the request to FBO staff. The customer is not directly booking a stand.'});
  document.getElementById('portal-select').classList.add('attention');
  document.getElementById('customer-live').scrollIntoView({behavior:'smooth',block:'start'});
}

function showPortal(name){
  document.body.classList.toggle('customer-view',name==='customer');
  document.body.classList.toggle('staff-view',name==='staff');
  document.querySelectorAll('.portal-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.portal===name));
  const selector=document.getElementById('portal-select');
  if(selector) selector.value=name;
  document.querySelectorAll('.portal-panel').forEach(panel=>panel.classList.remove('active-panel'));
  document.getElementById(`${name}-portal`).classList.add('active-panel');
  window.scrollTo({top:document.querySelector('.topbar').offsetTop,behavior:'smooth'});
}

document.getElementById('portal-select').addEventListener('change',event=>showPortal(event.target.value));

document.getElementById('chat-toggle').addEventListener('click',()=>{
  const card=document.getElementById('chatbot-card');
  const toggle=document.getElementById('chat-toggle');
  const open=card.classList.toggle('chat-open');
  toggle.setAttribute('aria-expanded',String(open));
  toggle.classList.toggle('chat-active',open);
});

function renderAirportGrid(){
  document.getElementById('airport-grid').innerHTML = airports.filter(airport=>focusAirportCodes.includes(airport.code)).map(airport=>`<div class="airport-mini ${airport.type}"><span class="mini-tag">${airport.code==='VNY'?'Primary':'Backup'}</span><h4>${airport.code}</h4><p>${airport.name} · ${airport.role}</p><small>${airport.fact}</small></div>`).join('');
}

function renderMatches(size){
  size='heavy';
  const matches = airports.filter(airport=>focusAirportCodes.includes(airport.code) && airport.fit.includes(size)).sort((a,b)=>focusAirportCodes.indexOf(a.code)-focusAirportCodes.indexOf(b.code)).slice(0,3);
  const section=document.getElementById('match-results');
  section.classList.remove('hidden');
  const flightType=document.getElementById('flight-type').value;
  const budget=document.getElementById('budget').value;
  const operation=document.getElementById('operation-type').value;
  const guestCount=Number(document.getElementById('passengers').value||0)+Number(document.getElementById('crew').value||0);
  const cost=size==='vip'?'$32,000–$48,000':size==='heavy'?'$18,000–$30,000':size==='midsize'?'$11,000–$19,000':'$7,000–$13,000';
  const driveFor=(airport)=>airport.drive;
  const turnaround=operation==='touch-and-go'?'1h 25m':operation==='drop-off'?'55m':'2h 10m';
  const parkingStatus=operation==='overnight'?'Hangar / ramp fit available':'No overnight parking required';
  section.innerHTML=`<div class="result-banner"><strong>Planning suggestions ready.</strong> We compared the Van Nuys plan with two approved backup options for your heavy business jet. A suggestion is not a decision; an FBO manager still confirms the reservation.</div><div class="result-grid">${matches.map((airport,index)=>{const costs=costBreakdowns[airport.code];return `<article class="airport-result ${index===0?'recommended':''}"><div class="result-top"><span class="airport-code">${airport.code}</span><span class="fit-label">${index===0?'Suggested fit':'Backup option'}</span></div><h4>${airport.name} · ${airport.role}</h4><p>${airport.fact}<br>${flightType} handling · ${driveFor(airport)} event-week drive estimate · ${operation==='touch-and-go'?'Touch-and-go plan':'Overnight plan'}</p><div class="result-details"><span><small>Estimated total</small><strong>${cost}</strong></span><span><small>Parking / hangar</small><strong>${parkingStatus}</strong></span><span><small>Fuel + service</small><strong>Available</strong></span><span><small>Turnaround</small><strong>${turnaround}</strong></span><span><small>Security estimate</small><strong>${document.getElementById('security-request').value.includes('VIP')||document.getElementById('vip-status').value!=='Standard guest'?'Enhanced':'Standard'}</strong></span><span><small>Departure readiness</small><strong>${operation==='overnight'?'After service':'Same-day'}</strong></span></div><details class="cost-breakdown"><summary>View estimated cost breakdown</summary><div><span>Landing fee <strong>${costs.landing}</strong></span><span>Parking fee <strong>${costs.parking}</strong></span><span>Hangar / overflow <strong>${costs.hangar}</strong></span><span>Fuel <strong>${costs.fuel}</strong></span><span>Line staff <strong>${costs.staff}</strong></span><span>Security estimate <strong>${costs.security}</strong></span><span>Transportation estimate <strong>${costs.transport}</strong></span><span>Special-event fee <strong>${costs.event}</strong></span></div></details><div class="result-reason"><strong>Why selected:</strong> ${matchReasons[size]} ${operation==='touch-and-go'?'The aircraft can land, refuel, receive limited services, and depart without consuming overnight parking.':'The recommendation balances runway fit, parking, fuel, staffing, and timing.'} It fits the requested ${budget.toLowerCase()} budget range.</div><div class="result-actions"><button class="secondary-button" data-request="${airport.code}">${index===0?'Request confirmation':'Compare option'} →</button><button class="text-button" data-edit="true">Edit information</button></div></article>`;}).join('')}</div><div class="result-disclaimer"><strong>Suggestion only — not a decision.</strong> Final availability, pricing, safety, and booking must be confirmed by an FBO representative.</div>`;
  section.querySelectorAll('[data-request]').forEach(button=>button.addEventListener('click',()=>{
    button.textContent='Request sent ✓'; button.disabled=true; button.style.opacity='.7';
    beginRequest(button.dataset.request);
  }));
  section.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>document.getElementById('match-form').scrollIntoView({behavior:'smooth',block:'start'})));
  section.scrollIntoView({behavior:'smooth',block:'start'});
}

document.getElementById('match-form').addEventListener('submit',(event)=>{
  event.preventDefault();
  const arrival=new Date(`${document.getElementById('arrival-date').value}T${document.getElementById('arrival-time').value}`);
  const departure=new Date(`${document.getElementById('departure-date').value}T${document.getElementById('departure-time').value}`);
  if(departure<=arrival){
    openModal({eyebrow:'Check the trip window',title:'Departure must be after arrival',content:'<p class="modal-copy">Update the departure date or time so the FBO can plan a valid stay or turnaround.</p>',action:'Edit dates'});
    document.getElementById('modal-action').onclick=()=>{closeModal();document.getElementById('departure-date').focus();};
    return;
  }
  renderMatches(document.getElementById('aircraft-size').value);
});

document.getElementById('customer-message-button').addEventListener('click',()=>{
  const button=document.getElementById('customer-message-button');
  button.textContent='Message queued for FBO review ✓';
  button.disabled=true;
  setText('staff-request-note','Customer message queued in the AeroGreen relay. FBO staff will respond after reviewing the request.');
});

document.getElementById('chat-form').addEventListener('submit',(event)=>{
  event.preventDefault();
  const input=document.getElementById('chat-input');
  const question=input.value.trim();
  if(!question) return;
  const messages=document.getElementById('chat-messages');
  const user=document.createElement('div');
  user.className='chat-bubble user';
  user.textContent=question;
  messages.appendChild(user);
  const answer=document.createElement('div');
  answer.className='chat-bubble bot';
  const normalized=question.toLowerCase();
  answer.textContent=normalized.includes('sunday')||normalized.includes('space')?'The FBO team is planning to hold VNY space for the Sunday post-game departure window. Final space is confirmed by staff.':normalized.includes('fee')||normalized.includes('price')?'I can show a planning estimate after you enter the aircraft, timing, operation, and service needs. The FBO must confirm the final quote.':normalized.includes('approve')||normalized.includes('decision')?'I provide planning guidance only. A qualified FBO representative makes the final approval decision.':'I can help explain your VNY request, parking, fuel, timing, Sunday capacity, or the approval process.';
  messages.appendChild(answer);
  input.value='';
  messages.scrollTop=messages.scrollHeight;
});

document.getElementById('staff-request-info').addEventListener('click',()=>{
  if(!activeRequest){
    setText('staff-request-note','Submit a customer request first so the team can ask for missing information.');
    return;
  }
  setRequestState({status:'Information requested',stage:1,flightStatus:'Awaiting verified flight details',eta:'Pending customer response',note:'The FBO requested more information before confirming aircraft fit and capacity.'});
  const chip=document.getElementById('active-request-chip');
  if(chip){chip.textContent='Info needed';chip.className='status-chip pending';}
});

document.getElementById('staff-approve-request').addEventListener('click',()=>{
  if(!activeRequest){
    setText('staff-request-note','Submit a customer request first so the team has a reservation to review.');
    return;
  }
  setRequestState({status:'FBO approved · final confirmation',stage:2,flightStatus:'Planning signal active · monitor ETA',eta:formatRequestDate(activeRequest.arrivalDate,activeRequest.arrivalTime),note:'A qualified FBO representative approved the planning request. Final operational instructions still come from the FBO team.'});
  const chip=document.getElementById('active-request-chip');
  if(chip){chip.textContent='Approved';chip.className='status-chip approved';}
  const button=document.getElementById('staff-approve-request');
  button.innerHTML='Request approved ✓';
  button.disabled=true;
  button.style.background='#4d9b87';
});

document.getElementById('notifications-button').addEventListener('click',()=>openModal({eyebrow:'Operations alerts',title:'No critical alerts',content:'<p class="modal-copy">The demo queue is stable. The main planning watch item is the Sunday post-game departure surge, with six VNY stands protected and LAX/ONT held as backups.</p><div class="modal-list"><span>✓</span><strong>Capacity watch active</strong><small>VNY primary plan is being monitored.</small><span>✓</span><strong>Human approval required</strong><small>No request is auto-booked.</small></div>',action:'Close'}));

const requestFilterMenu=document.getElementById('request-filter-menu');
const requestFilterToggle=document.getElementById('request-filter-toggle');
const requestFilterOptions=document.getElementById('request-filter-options');
requestFilterToggle.addEventListener('click',()=>{
  const isOpen=requestFilterToggle.getAttribute('aria-expanded')==='true';
  requestFilterToggle.setAttribute('aria-expanded',String(!isOpen));
  requestFilterOptions.hidden=isOpen;
});
requestFilterOptions.addEventListener('click',(event)=>{
  const option=event.target.closest('[data-filter]');
  if(!option) return;
  const filter=option.dataset.filter;
  requestFilterToggle.textContent=`${filter}⌄`;
  requestFilterToggle.setAttribute('aria-expanded','false');
  requestFilterOptions.hidden=true;
  const rows=[...document.querySelectorAll('#request-rows tr')];
  rows.forEach(row=>{
    const chip=row.querySelector('.status-chip');
    const status=chip?.textContent.trim().toLowerCase()||'';
    const visible=filter==='All requests'||(filter==='Needs review'&&['review','info needed'].includes(status))||(filter==='Approved'&&status==='approved')||(filter==='Pending'&&status==='pending');
    row.hidden=!visible;
  });
  const visibleCount=rows.filter(row=>!row.hidden).length;
  setText('request-count',`Showing ${visibleCount} of 18 requests`);
});
document.addEventListener('click',(event)=>{
  if(!requestFilterMenu.contains(event.target)){
    requestFilterToggle.setAttribute('aria-expanded','false');
    requestFilterOptions.hidden=true;
  }
});

document.getElementById('view-all-requests').addEventListener('click',()=>openModal({eyebrow:'Reservation queue',title:'All modeled requests',content:'<p class="modal-copy">The prototype models 18 Super Bowl-week requests. The table keeps the three highest-priority examples visible so the FBO team can focus on fit, timing, and resource pressure first.</p><div class="modal-metrics"><div><strong>18</strong><span>Total requests</span></div><div><strong>7</strong><span>Need review</span></div><div><strong>6</strong><span>Sunday departures</span></div><div><strong>5</strong><span>Backup candidates</span></div></div>',action:'Close'}));

document.getElementById('modal-close').addEventListener('click',closeModal);
document.getElementById('modal-action').addEventListener('click',closeModal);
document.getElementById('site-modal').addEventListener('click',(event)=>{if(event.target.id==='site-modal') closeModal();});

const ordinaryWeekBaseline={arrivals:35,parking:'55%',staff:'0',net:'$96k'};
const scenarioData={low:{label:'Low-demand case',arrivals:'78',parking:'61%',staff:'0',net:'$142k',alert:'Capacity is healthy. Keep VNY primary and leave LAX and ONT available as limited backups.',curve:[42,48,55,61,68,73,78]},medium:{label:'Medium-demand case',arrivals:'120',parking:'90%',staff:'4',net:'$184k',alert:'Protect six VNY stands for the Sunday evening departure window. Use LAX or ONT when needed.',curve:[58,69,79,88,102,114,120]},high:{label:'High-demand case',arrivals:'165',parking:'100%',staff:'11',net:'$219k',alert:'VNY is full. Activate the approved LAX/ONT backup plan, add line staff, and use flexible-slot pricing.',curve:[70,86,105,125,145,158,165]}};
function renderScenarioVisual(data){const chart=document.getElementById('demand-chart');if(!chart)return;const max=180;chart.innerHTML=data.curve.map((value,index)=>`<i class="demand-bar ${index===6?'peak':''}" style="height:${Math.round(value/max*100)}%" data-value="${value}"></i>`).join('');document.getElementById('visual-label').textContent=`${data.label.replace('-demand case','')} · Sunday peak`}
document.getElementById('scenario-select').addEventListener('change',(event)=>{
  const data=scenarioData[event.target.value];
  document.querySelector('.scenario-card')?.classList.toggle('low-demand',event.target.value==='low');
  document.getElementById('scenario-arrivals').textContent=data.arrivals;
  document.getElementById('scenario-parking').textContent=data.parking;
  document.getElementById('scenario-staff').textContent=data.staff;
  document.getElementById('scenario-net').textContent=data.net;
  document.getElementById('scenario-alert').textContent=data.alert;
  renderScenarioVisual(data);
  document.getElementById('baseline-demand').textContent=`${data.arrivals} arrivals`;
  document.getElementById('baseline-demand-note').textContent=data.label;
  document.getElementById('baseline-change').textContent=`+${Math.round((Number(data.arrivals)/ordinaryWeekBaseline.arrivals-1)*100)}%`;
});
renderScenarioVisual(scenarioData.medium);
document.querySelector('.scenario-card')?.classList.remove('low-demand');

renderAirportGrid();
showPortal(document.getElementById('portal-select').value);
