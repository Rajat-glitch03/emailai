/* Tandem prototype — plain browser JavaScript, no build tools or dependencies. */
(() => {
  'use strict';

  const KEY = 'tandem-prototype-v1';
  const seed = [
    {
      id:'t1', sender:'Elena Marlow', email:'elena@marlowstudio.com', initials:'EM', color:'#ead8c8', subject:'Re: Studio launch — final approval', preview:'We are happy with the direction. Alex, could you confirm the final budget before we move ahead?', time:'10:42 AM', date:'Today', classification:'client_to_reply', confidence:96, priority:'High', unread:true, starred:true, archived:false, done:false, important:true, meeting:false,
      summary:'Elena is ready to approve the studio launch, but needs the client to confirm the final budget before the team can proceed.', reason:'The sender is explicitly asking for the client’s approval on a financial decision. This is a personal decision, not an administrative task.', action:'Review the final budget and confirm approval.',
      messages:[
        {from:'Elena Marlow', time:'Yesterday · 4:18 PM', text:'The revised launch plan looks very good from our side. I have one final question about the budget allocation before we lock everything in.'},
        {from:'Alex Morgan', time:'Yesterday · 5:02 PM', text:'Thanks, Elena. I have shared the revised numbers with the team and will make sure the final approval is clear.'},
        {from:'Elena Marlow', time:'Today · 10:42 AM', text:'We are happy with the direction. Alex, could you confirm the final budget before we move ahead? Once we have your approval, we can release the production dates.'}
      ]
    },
    {
      id:'t2', sender:'Dr. Samuel Reed', email:'samuel@reedclinic.com', initials:'SR', color:'#d8e2d7', subject:'Moving Thursday’s board check-in', preview:'Could we move our 11:30 meeting to 2:00 PM? I can make either room work.', time:'10:16 AM', date:'Today', classification:'assistant_to_reply', confidence:93, priority:'Normal', unread:true, starred:false, archived:false, done:false, important:false, meeting:true,
      summary:'Samuel needs to reschedule Thursday’s check-in from 11:30 AM to 2:00 PM.', reason:'This is routine calendar coordination. The assistant can check availability and confirm a new time.', action:'Check the calendar and confirm the revised time.',
      messages:[{from:'Dr. Samuel Reed',time:'Today · 10:16 AM',text:'Hi Alex — would it be possible to move our Thursday board check-in from 11:30 AM to 2:00 PM? I can make either room work. Please let me know what suits.'}]
    },
    {
      id:'t3', sender:'Nora Chen', email:'nora@fieldwork.co', initials:'NC', color:'#e4dced', subject:'Updated invoice for October', preview:'I have attached the corrected invoice with the updated billing address. Let me know if anything else is needed.', time:'9:54 AM', date:'Today', classification:'assistant_to_reply', confidence:91, priority:'Normal', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'Nora sent a corrected October invoice and is waiting for a quick acknowledgement.', reason:'This is a routine administrative receipt. The assistant can acknowledge it and route it for filing.', action:'Acknowledge receipt and file the invoice.',
      messages:[{from:'Nora Chen',time:'Today · 9:54 AM',text:'Hi Alex, attaching the corrected invoice for October with the updated billing address. Let me know if anything else is needed from my side.'}]
    },
    {
      id:'t4', sender:'Meridian Legal', email:'team@meridianlegal.com', initials:'ML', color:'#e9e0c8', subject:'Revised service agreement — section 8', preview:'The updated indemnity language is ready. Please review the final wording before signature.', time:'9:21 AM', date:'Today', classification:'needs_review', confidence:58, priority:'High', unread:true, starred:false, archived:false, done:false, important:true, meeting:false,
      summary:'Meridian Legal shared revised contract wording and asks for a final review before signature.', reason:'The message concerns legal wording and a contractual commitment. The AI cannot confidently decide whether the assistant or client should respond.', action:'Review the clause with the client before replying.',
      messages:[{from:'Meridian Legal',time:'Today · 9:21 AM',text:'We have updated the indemnity language in section 8 as discussed. Please review the final wording before signature. Happy to arrange a short call if useful.'}]
    },
    {
      id:'t5', sender:'Maya at Northline', email:'maya@northline.events', initials:'MN', color:'#d9e6e8', subject:'Venue hold expires Friday', preview:'Just a reminder that the Cedar Room is on hold until Friday at 5 PM. No action needed unless you would like us to extend it.', time:'Yesterday', date:'Yesterday', classification:'client_to_reply', confidence:88, priority:'High', unread:false, starred:true, archived:false, done:false, important:true, meeting:false,
      summary:'A venue reservation is being held until Friday at 5 PM. The client needs to decide whether to proceed or release it.', reason:'The choice affects the client’s event and budget, so the assistant should surface it rather than decide independently.', action:'Decide whether to keep the Cedar Room hold.',
      messages:[{from:'Maya at Northline',time:'Yesterday · 3:37 PM',text:'A quick reminder that the Cedar Room is on hold for you until Friday at 5 PM. We can extend it by one business day if you would like. Just let me know.'}]
    },
    {
      id:'t6', sender:'Notion', email:'team@notion.so', initials:'N', color:'#e5e5e1', subject:'Your weekly workspace digest', preview:'A look at what changed across your workspace this week.', time:'Yesterday', date:'Yesterday', classification:'no_reply_needed', confidence:99, priority:'Low', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'An automated weekly digest with workspace activity. No response is expected.', reason:'This is an automated informational notification with no request or action.', action:'No action needed.',
      messages:[{from:'Notion',time:'Yesterday · 8:00 AM',text:'Here is your weekly workspace digest. Your team made 12 updates across 4 projects this week.'}]
    },
    {
      id:'t7', sender:'Oliver Grant', email:'oliver@grantpartners.io', initials:'OG', color:'#e7d8da', subject:'Could you share the Q4 availability?', preview:'We would like to schedule a 30-minute review with the team next week.', time:'Mon', date:'Earlier', classification:'assistant_to_reply', confidence:90, priority:'Normal', unread:false, starred:false, archived:false, done:false, important:false, meeting:true,
      summary:'Oliver wants to book a 30-minute Q4 review next week and is waiting for available times.', reason:'Scheduling is a routine assistant responsibility. The client does not need to make a personal decision yet.', action:'Share two or three available time slots.',
      messages:[{from:'Oliver Grant',time:'Monday · 2:12 PM',text:'Would you be able to share a few windows for a 30-minute Q4 review next week? We can work around the team’s availability.'}]
    },
    {
      id:'t8', sender:'Priya Shah', email:'priya@studioform.in', initials:'PS', color:'#e9ddc9', subject:'Re: Partnership direction', preview:'I can make the introduction, but I would like to understand whether this is a priority for you this quarter.', time:'Mon', date:'Earlier', classification:'client_to_reply', confidence:94, priority:'Normal', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'Priya can make a strategic introduction and is asking whether the client wants to pursue it this quarter.', reason:'This is a relationship and strategic-priority decision that should come directly from the client.', action:'Decide whether to pursue the partnership introduction.',
      messages:[{from:'Priya Shah',time:'Monday · 11:08 AM',text:'I can make the introduction to the team. Before I do, I would like to understand whether this is a priority for you this quarter, or whether we should revisit it later.'}]
    },
    {
      id:'t9', sender:'Atlas Travel', email:'support@atlastravel.com', initials:'AT', color:'#dce5e8', subject:'Your itinerary is confirmed', preview:'Your booking reference and travel details are included below.', time:'Sun', date:'Earlier', classification:'no_reply_needed', confidence:98, priority:'Low', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'Automated travel confirmation with itinerary details. No reply is needed.', reason:'This is a confirmation notification and does not ask a question.', action:'Save itinerary for reference.',
      messages:[{from:'Atlas Travel',time:'Sunday · 7:30 PM',text:'Your itinerary is confirmed. Your booking reference is AT-48291. Please review the details attached to this message.'}]
    },
    {
      id:'t10', sender:'Jamie Brooks', email:'jamie@brooksdesign.com', initials:'JB', color:'#dce1d1', subject:'Re: Brand review — next steps', preview:'Thank you, that works. I will send the updated files by end of day tomorrow.', time:'Sun', date:'Earlier', classification:'waiting_for_response', confidence:87, priority:'Normal', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'The assistant has already replied and Jamie committed to sending updated files tomorrow.', reason:'The next move belongs to the sender. Keep this conversation visible until the promised files arrive.', action:'Follow up tomorrow afternoon if files have not arrived.',
      messages:[{from:'Alex Morgan',time:'Sunday · 1:15 PM',text:'Thanks Jamie. The direction looks good. Please send the updated files when ready and we will review them.'},{from:'Jamie Brooks',time:'Sunday · 2:02 PM',text:'Thank you, that works. I will send the updated files by end of day tomorrow.'}]
    },
    {
      id:'t11', sender:'The Modern Office', email:'hello@themodernoffice.com', initials:'MO', color:'#e8d9ce', subject:'A few ideas for your workspace', preview:'Our latest collection is here — thoughtful pieces for the new season.', time:'Sat', date:'Earlier', classification:'no_reply_needed', confidence:99, priority:'Low', unread:false, starred:false, archived:false, done:false, important:false, meeting:false,
      summary:'A marketing newsletter featuring a new product collection.', reason:'Promotional content with no direct request.', action:'No action needed.',
      messages:[{from:'The Modern Office',time:'Saturday · 9:00 AM',text:'Our new collection is here. Explore the latest pieces for your workspace.'}]
    },
    {
      id:'t12', sender:'Daniel Kim', email:'daniel@kineticlabs.com', initials:'DK', color:'#d7e0e6', subject:'Please confirm the keynote title', preview:'The conference programme is going to print tomorrow. Could you confirm the title today?', time:'Sat', date:'Earlier', classification:'client_to_reply', confidence:93, priority:'High', unread:false, starred:true, archived:false, done:false, important:true, meeting:false,
      summary:'The conference organiser needs the client to approve the keynote title before the programme goes to print.', reason:'The title represents the client publicly and needs their personal approval.', action:'Confirm or edit the keynote title.',
      messages:[{from:'Daniel Kim',time:'Saturday · 10:14 AM',text:'We are sending the conference programme to print tomorrow. Could you confirm your keynote title today? We currently have “Designing for the Next Chapter”.'}]
    }
  ];

  const safeParse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
  const stored = safeParse(localStorage.getItem(KEY), null);
  const state = {
    emails: stored && Array.isArray(stored.emails) ? stored.emails : seed,
    connected: stored?.connected || [],
    activeFilter: 'all', selectedId: 't1', search: '', role: 'assistant', modal: null, toastTimer: null,
    askText: '', askAnswer: '', drafts: stored?.drafts || []
  };
  const app = document.getElementById('app');
  const toastRegion = document.getElementById('toast-region');

  const icons = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    inbox:'<path d="M4 4h16v16H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M2.8 19c.6-3 2.7-4.5 6.2-4.5"/><path d="M16 11a3 3 0 1 0 0-6M15 15c3.4 0 5.1 1.4 5.6 4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-1.8 1.8-1.9-1.1-.2.1-2.1.9-.5 2.2h-2.6l-.5-2.2-2.1-.9-.2-.1-1.9 1.1-1.8-1.8 1.1-1.9-.1-.2-.9-2.1L2.8 12v-2.6L5 8.9l.9-2.1.1-.2-1.1-1.9 1.8-1.8 1.9 1.1.2-.1 2.1-.9.5-2.2H14l.5 2.2 2.1.9.2.1 1.9-1.1 1.8 1.8-1.1 1.9.1.2.9 2.1 2.2.5V12l-2.2.5-.9 2.1Z"/>',
    spark:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    archive:'<path d="M4 5h16v4H4zM5 9v11h14V9M9 13h6"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    x:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    send:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    chevron:'<path d="m7 10 5 5 5-5"/>',
    eye:'<path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
    reply:'<path d="m10 8-6 4 6 4v-3c5 0 8 1 10 5-.5-6-3-10-10-10V8Z"/>',
    sparkle:'<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/>'
  };
  const icon = (name, size=16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.mail}</svg>`;
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const persist = () => localStorage.setItem(KEY, JSON.stringify({emails:state.emails,connected:state.connected,drafts:state.drafts}));
  const getEmail = id => state.emails.find(e => e.id === id);
  const activeEmails = () => state.emails.filter(e => !e.archived && !e.done);
  const byFilter = (e) => {
    if (state.activeFilter === 'archived') return e.archived;
    if (e.archived || e.done) return false;
    switch (state.activeFilter) {
      case 'assistant_to_reply': return e.classification === 'assistant_to_reply';
      case 'client_to_reply': return e.classification === 'client_to_reply';
      case 'no_reply_needed': return e.classification === 'no_reply_needed';
      case 'waiting_for_response': return e.classification === 'waiting_for_response';
      case 'needs_review': return e.classification === 'needs_review';
      case 'important': return e.important || e.starred;
      case 'meetings': return e.meeting;
      case 'archived': return e.archived;
      default: return true;
    }
  };
  const visibleEmails = () => state.emails.filter(e => byFilter(e) && `${e.sender} ${e.subject} ${e.preview}`.toLowerCase().includes(state.search.toLowerCase()));
  const count = filter => state.emails.filter(e => !e.archived && !e.done && (filter === 'all' || (filter === 'important' ? e.important || e.starred : filter === 'meetings' ? e.meeting : e.classification === filter))).length;
  const labelFor = value => ({assistant_to_reply:'Assistant to reply',client_to_reply:'Client to reply',no_reply_needed:'No reply needed',needs_review:'Needs review',waiting_for_response:'Waiting for response'}[value] || value);
  const badgeClass = value => ({assistant_to_reply:'badge-assistant',client_to_reply:'badge-client',no_reply_needed:'badge-none',needs_review:'badge-review',waiting_for_response:'badge-waiting'}[value] || 'badge-none');
  const avatar = e => `<span class="avatar" style="background:${e.color || '#e4e5dc'}">${esc(e.initials || '•')}</span>`;
  const toast = message => {
    const node = document.createElement('div'); node.className='toast'; node.innerHTML=`<span>✓</span>${esc(message)}`; toastRegion.appendChild(node);
    setTimeout(()=>node.remove(),3200);
  };

  function sidebar() {
    const navs = [
      ['all','inbox','All mail'],['assistant_to_reply','check','Assistant to reply'],['client_to_reply','user','Client to reply'],['no_reply_needed','mail','No reply needed'],['needs_review','spark','Needs review'],['waiting_for_response','clock','Waiting for response']
    ];
    return `<aside class="sidebar ${state.sidebarOpen?'open':''}" id="sidebar">
      <div class="brand"><div class="brand-mark">t.</div><div><div class="brand-name">tandem</div><div class="brand-caption">A little more in sync</div></div></div>
      <button class="workspace-switch" data-action="workspace"><span class="workspace-avatar">H</span><span class="wmeta"><strong>Harper & Co.</strong><small>Personal workspace</small></span>${icon('chevron',13)}</button>
      <div class="nav-label">Your inbox</div>
      <nav class="nav-list">${navs.map(([id,ico,label])=>`<button class="nav-item ${state.activeFilter===id?'active':''}" data-filter="${id}"><span class="nav-ico">${icon(ico,15)}</span><span>${label}</span><span class="nav-count">${count(id)}</span></button>`).join('')}</nav>
      <hr class="sidebar-sep" />
      <div class="nav-label">Keep in view</div>
      <nav class="nav-list">
        <button class="nav-item ${state.activeFilter==='important'?'active':''}" data-filter="important"><span class="nav-ico">${icon('star',15)}</span><span>Important</span><span class="nav-count">${count('important')}</span></button>
        <button class="nav-item ${state.activeFilter==='meetings'?'active':''}" data-filter="meetings"><span class="nav-ico">${icon('calendar',15)}</span><span>Meetings & dates</span><span class="nav-count">${count('meetings')}</span></button>
        <button class="nav-item ${state.activeFilter==='archived'?'active':''}" data-filter="archived"><span class="nav-ico">${icon('archive',15)}</span><span>Archive</span></button>
      </nav>
      <div class="sidebar-bottom">
        <div class="connection-card"><div class="connection-top"><span>Connected accounts</span><span class="connection-dot"></span></div><p>${state.connected.length ? `${state.connected.length} demo account${state.connected.length>1?'s':''} connected` : 'Connect a mailbox to see how your inbox comes together.'}</p><button class="connection-link" data-action="connect">Manage accounts ${icon('arrow',11)}</button></div>
        <div class="profile"><span class="profile-avatar">A</span><span class="profile-meta"><strong>Alex Morgan</strong><small>Personal assistant</small></span><button data-action="settings" aria-label="Settings">${icon('settings',16)}</button></div>
      </div>
    </aside>`;
  }

  function topbar() {
    return `<header class="topbar"><div style="display:flex;align-items:center;gap:11px"><button class="icon-button mobile-menu" data-action="menu" aria-label="Open menu">${icon('menu',16)}</button><div class="breadcrumb">Workspace <span> / </span><strong>${state.role==='client'?'Your attention':'Inbox'}</strong></div></div><div class="top-actions"><div class="date-chip">${icon('calendar',13)} Monday, 16 November</div><button class="icon-button" data-action="notifications" aria-label="Notifications">${icon('mail',15)}<i class="notify"></i></button><div class="view-toggle"><button class="${state.role==='assistant'?'active':''}" data-role="assistant">Assistant</button><button class="${state.role==='client'?'active':''}" data-role="client">Client view</button></div></div></header>`;
  }

  function statCard(label,value,foot,filter,orb) {
    return `<button class="stat-card clickable" data-stat="${filter}" style="--stat-orb:${orb};text-align:left"><div class="stat-top"><span>${label}</span>${icon('arrow',12)}</div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></button>`;
  }

  function listPanel() {
    const emails = visibleEmails();
    const tabs = [['all','All mail'],['assistant_to_reply','Assistant'],['client_to_reply','Client'],['no_reply_needed','No reply'],['needs_review','Review']];
    return `<section class="panel"><div class="panel-head"><div><div class="panel-title">Your conversations</div><div class="panel-hint">A clear view of what needs a human next.</div></div><div class="panel-head-actions"><label class="search-box">${icon('search',14)}<input id="search-input" placeholder="Search mail" value="${esc(state.search)}" /></label><button class="small-tool" data-action="connect" title="Connect account">${icon('plus',14)}</button></div></div>
      <div class="filter-row">${tabs.map(([id,label])=>`<button class="filter-pill ${state.activeFilter===id?'active':''}" data-filter="${id}">${label} <span>${count(id)}</span></button>`).join('')}</div>
      <div class="email-list">${emails.length?emails.map(e=>`<article class="email-row ${state.selectedId===e.id?'selected':''} ${e.unread?'unread':''}" data-select="${e.id}">
        ${avatar(e)}<div class="email-main"><div class="email-line"><span class="sender">${esc(e.sender)}</span><span class="email-time">${esc(e.time)}</span></div><div class="email-subject">${esc(e.subject)}</div><div class="email-preview">${esc(e.preview)}</div><div class="row-bottom"><span class="badge ${badgeClass(e.classification)}">${labelFor(e.classification)}</span>${e.important?'<span class="priority-mark">· Important</span>':''}${e.override?'<span class="priority-mark">· Edited</span>':''}</div></div>
        <div class="row-actions"><button class="star-button ${e.starred?'starred':''}" data-action="star" data-id="${e.id}" title="Toggle important">${icon('star',13)}</button><span class="priority-mark">${e.date==='Today'?'●':''}</span></div></article>`).join(''):`<div class="empty-state">${icon('inbox',23)}<strong>Nothing here just now</strong>Try another view or clear your search.</div>`}</div>
      <div class="list-footer"><span>Showing ${emails.length} conversations</span><span>Sorted by newest first</span></div></section>`;
  }

  function detailPanel() {
    const e = getEmail(state.selectedId);
    if (!e) return `<section class="panel"><div class="empty-state">${icon('mail',24)}<strong>Choose a conversation</strong>Select an email to see the details.</div></section>`;
    return `<section class="panel detail-panel"><div class="detail-topline"><span class="detail-kicker">Conversation detail</span><div class="detail-tools"><button class="small-tool" data-action="read" data-id="${e.id}" title="Mark ${e.unread?'read':'unread'}">${icon('eye',13)}</button><button class="small-tool" data-action="archive" data-id="${e.id}" title="Archive">${icon('archive',13)}</button><button class="small-tool" data-action="close-detail" title="Close">${icon('x',13)}</button></div></div>
      <div class="detail-content"><h2 class="detail-subject">${esc(e.subject)}</h2><div class="sender-block">${avatar(e)}<div class="sender-info"><strong>${esc(e.sender)}</strong><small>${esc(e.email)} · ${esc(e.time)}</small></div><button class="star-button ${e.starred?'starred':''}" data-action="star" data-id="${e.id}">${icon('star',16)}</button></div>
      <div class="detail-classification"><div class="classification-head"><span class="classification-title">${icon('spark',12)} &nbsp;Tandem’s read</span><span class="confidence">${e.confidence}% confidence</span></div><div style="margin-top:8px"><span class="badge ${badgeClass(e.classification)}">${labelFor(e.classification)}</span></div><p class="reason"><strong>Why:</strong> ${esc(e.reason)}</p></div>
      <div class="ai-summary"><div class="section-caption">A useful summary</div><p class="summary-text">${esc(e.summary)}</p></div>
      <div class="section-caption" style="margin-top:17px">Conversation</div><div class="conversation">${e.messages.map(m=>`<div class="message-card"><div class="message-meta"><strong>${esc(m.from)}</strong><small>${esc(m.time)}</small></div><p>${esc(m.text)}</p></div>`).join('')}</div>
      <label class="select-label" for="classification-select">Responsibility · you can change this</label><select id="classification-select" class="classify-select" data-classify="${e.id}"><option value="assistant_to_reply" ${e.classification==='assistant_to_reply'?'selected':''}>Assistant to reply</option><option value="client_to_reply" ${e.classification==='client_to_reply'?'selected':''}>Client to reply</option><option value="no_reply_needed" ${e.classification==='no_reply_needed'?'selected':''}>No reply needed</option><option value="needs_review" ${e.classification==='needs_review'?'selected':''}>Needs review</option><option value="waiting_for_response" ${e.classification==='waiting_for_response'?'selected':''}>Waiting for response</option></select>
      <div class="detail-actions"><button class="btn btn-primary" data-action="draft" data-id="${e.id}">${icon('reply',13)} Prepare a reply</button><button class="btn" data-action="reanalyze" data-id="${e.id}">${icon('sparkle',13)} Re-read thread</button><button class="btn" data-action="done" data-id="${e.id}">${icon('check',13)} Mark handled</button></div>
      </div></section>`;
  }

  function rightStack() {
    const pending = state.emails.filter(e=>!e.archived&&!e.done&&e.meeting);
    return `<div class="right-stack"><section class="panel agenda-panel"><div class="panel-head"><div><div class="panel-title">On the horizon</div><div class="panel-hint">Dates pulled from your conversations.</div></div><span style="color:#929589">${icon('calendar',15)}</span></div>${pending.length?pending.slice(0,3).map((e,i)=>`<div class="agenda-item"><div class="agenda-time">${i===0?'Thu':'Next'}</div><div class="agenda-detail"><strong>${esc(e.subject)}</strong><small>${esc(e.sender)} · action in inbox</small><span class="meeting-tag">${e.classification==='assistant_to_reply'?'Scheduling':'Check details'}</span></div></div>`).join(''):'<div class="empty-state">No upcoming dates detected.</div>'}<div style="padding:7px 17px 11px"><button class="connection-link" style="color:#6c7c56" data-filter="meetings">View all meeting threads ${icon('arrow',11)}</button></div></section>
      <section class="ai-note"><div class="ai-note-top"><span class="ai-note-label">A thoughtful nudge</span><span class="ai-spark">${icon('sparkle',14)}</span></div><h3>One decision is holding up the rest.</h3><p>Elena is waiting for a budget approval. A quick decision could keep the studio launch on schedule.</p><button data-select="t1">Review Elena’s email ${icon('arrow',11)}</button></section>
      <section class="ask-box"><div class="ask-head"><strong>Ask your inbox</strong><small>DEMO ASSISTANT</small></div><form id="ask-form" class="ask-input-wrap">${icon('spark',13)}<input id="ask-input" placeholder="What needs my attention?" autocomplete="off"/><button class="ask-send" aria-label="Ask">${icon('arrow',13)}</button></form><div class="ask-answer ${state.askAnswer?'visible':''}" id="ask-answer">${esc(state.askAnswer)}</div></section></div>`;
  }

  function assistantPage() {
    const unread = state.emails.filter(e=>!e.archived&&!e.done&&e.unread).length;
    const waiting = count('waiting_for_response');
    return `<div class="page-head"><div><div class="eyebrow">Monday, 16 November 2026 · Your workspace</div><h1>Good morning, Alex.</h1><p class="page-subtitle">A quieter inbox starts with knowing <strong>who moves next.</strong></p></div><div class="head-buttons"><button class="btn" data-action="connect">${icon('plus',13)} Connect email</button><button class="btn btn-primary" data-action="simulate">${icon('sparkle',13)} New demo email</button></div></div>
      <div class="stats">${statCard('Conversations',activeEmails().length,'Across your client inboxes','all','#e8ebdd')}${statCard('Unread',unread,'Worth a first look','all','#e7eceb')}${statCard('Client attention',count('client_to_reply'),'Personal decisions to make','client_to_reply','#f5e5d9')}${statCard('Waiting on others',waiting,'Follow-ups to keep in view','waiting_for_response','#e5eaf0')}</div>
      <div class="content-grid">${listPanel()}<div class="right-stack">${detailPanel()}${rightStack()}</div></div>`;
  }

  function clientPage() {
    const items = state.emails.filter(e=>!e.archived&&!e.done&&e.classification==='client_to_reply');
    return `<div class="client-wrap"><div class="client-banner"><div><div class="eyebrow">Your personal brief</div><h1>The few things that need you.</h1><p>Alex has taken care of the day-to-day. These are the conversations where your judgement, approval or personal voice makes the difference.</p></div><div class="client-count"><strong>${items.length}</strong><span>need your attention</span></div></div>
      <div class="client-toolbar"><strong>For your review</strong><span class="badge badge-client">Client to reply</span></div>
      ${items.length?`<div class="client-list">${items.map(e=>`<article class="client-card"><div class="client-card-top"><div class="client-sender">${avatar(e)}<span><strong>${esc(e.sender)}</strong><small>${esc(e.email)} · ${esc(e.time)}</small></span></div><span class="email-time">${esc(e.date)}</span></div><h3>${esc(e.subject)}</h3><p>${esc(e.summary)}</p><div class="why-needed"><strong>Why this needs you</strong><br>${esc(e.reason)}</div><div class="client-card-foot"><button class="btn" data-action="client-open" data-id="${e.id}">Review</button><button class="btn" data-action="client-delegate" data-id="${e.id}">Ask Alex</button><button class="btn btn-primary" data-action="client-handle" data-id="${e.id}">Handled</button></div></article>`).join('')}</div>`:`<section class="panel empty-state" style="padding:48px 20px">${icon('check',25)}<strong>All caught up.</strong>There are no conversations waiting for your personal attention.</section>`}
      <div class="client-footer-note">Your choices are shared with Alex’s assistant workspace in this demo. You can hand a conversation back at any time.</div></div>`;
  }

  function modalMarkup() {
    if (!state.modal) return '';
    if (state.modal.type==='connect') return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><div class="eyebrow">Mailbox setup</div><h2 id="modal-title">Bring your inbox together.</h2><p>Connect a mailbox to preview how Tandem keeps client communication in one place.</p></div><button class="modal-close" data-action="close-modal">${icon('x',14)}</button></div><div class="modal-body"><div class="provider-list"><div class="provider-card"><div class="provider-icon" style="color:#b75f4d">G</div><div class="provider-text"><strong>Google Gmail</strong><small>${state.connected.includes('Gmail')?'Demo account connected':'Preview the Google connection flow'}</small></div><button data-provider="Gmail">${state.connected.includes('Gmail')?'Connected':'Connect demo'}</button></div><div class="provider-card"><div class="provider-icon" style="color:#4772a6">O</div><div class="provider-text"><strong>Microsoft Outlook</strong><small>${state.connected.includes('Outlook')?'Demo account connected':'Preview the Microsoft connection flow'}</small></div><button data-provider="Outlook">${state.connected.includes('Outlook')?'Connected':'Connect demo'}</button></div></div><p class="prototype-note">Prototype mode: these buttons simulate account connection and use sample conversations. No mailbox credentials are requested and no real email is imported or sent.</p></div></section></div>`;
    if (state.modal.type==='draft') {
      const e=getEmail(state.modal.id); if(!e) return '';
      const draft = state.modal.text ?? draftFor(e);
      return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><div class="eyebrow">Writing room</div><h2 id="modal-title">A considered reply.</h2><p>Review and edit the draft before using it. Tandem never sends on your behalf.</p></div><button class="modal-close" data-action="close-modal">${icon('x',14)}</button></div><div class="modal-body"><label class="draft-label">To · ${esc(e.sender)} &lt;${esc(e.email)}&gt;</label><textarea class="draft-textarea" id="draft-text">${esc(draft)}</textarea><div class="modal-actions"><button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-action="save-draft" data-id="${e.id}">${icon('check',13)} Save draft</button></div></div></section></div>`;
    }
    if (state.modal.type==='client-detail') {
      const e=getEmail(state.modal.id); if(!e) return '';
      return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><div class="eyebrow">Original conversation</div><h2 id="modal-title">${esc(e.subject)}</h2><p>${esc(e.sender)} · ${esc(e.email)}</p></div><button class="modal-close" data-action="close-modal">${icon('x',14)}</button></div><div class="modal-body"><div class="detail-classification"><span class="badge ${badgeClass(e.classification)}">${labelFor(e.classification)}</span><p class="reason">${esc(e.reason)}</p></div><div class="conversation">${e.messages.map(m=>`<div class="message-card"><div class="message-meta"><strong>${esc(m.from)}</strong><small>${esc(m.time)}</small></div><p>${esc(m.text)}</p></div>`).join('')}</div><div class="modal-actions"><button class="btn" data-action="client-delegate" data-id="${e.id}">Ask Alex to handle</button><button class="btn btn-primary" data-action="client-handle" data-id="${e.id}">I’ve handled this</button></div></div></section></div>`;
    }
    if (state.modal.type==='settings') return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">Workspace preferences</div><h2>Make it feel like yours.</h2><p>Prototype settings for the Harper & Co. workspace.</p></div><button class="modal-close" data-action="close-modal">${icon('x',14)}</button></div><div class="modal-body"><div class="provider-card"><div class="provider-icon">A</div><div class="provider-text"><strong>Alex Morgan</strong><small>Personal assistant · Harper & Co.</small></div></div><div style="padding:14px 0 3px;color:#777d71;font-size:10px;line-height:1.7">Tandem keeps AI suggestions editable. Your manual decisions take priority over the initial classification in this prototype. All demo changes are saved in this browser only.</div><div class="modal-actions"><button class="btn btn-danger" data-action="reset-demo">Reset demo data</button><button class="btn btn-primary" data-action="close-modal">Done</button></div></div></section></div>`;
    return '';
  }

  function render() {
    app.innerHTML = `${sidebar()}${state.sidebarOpen?'<div class="mobile-scrim" data-action="menu-close"></div>':''}<main class="main-area">${topbar()}${state.role==='client'?clientPage():assistantPage()}</main>${modalMarkup()}`;
    bindDynamic();
  }

  function draftFor(e) {
    if (e.classification==='assistant_to_reply') return `Hi ${e.sender.split(' ')[0]},\n\nThanks for getting in touch. I’ve received your note and will take care of this. I’ll check the details and come back to you with an update shortly.\n\nBest,\nAlex`;
    if (e.classification==='client_to_reply') return `Hi ${e.sender.split(' ')[0]},\n\nThank you for sharing this. I’m reviewing the details and will come back to you shortly with a decision.\n\nBest,\nAlex`;
    return `Hi ${e.sender.split(' ')[0]},\n\nThank you for the update. I appreciate you keeping us informed.\n\nBest,\nAlex`;
  }

  function bindDynamic() {
    const search=document.getElementById('search-input');
    if(search){ search.addEventListener('input',e=>{state.search=e.target.value; const pos=e.target.selectionStart; render(); const next=document.getElementById('search-input'); next?.focus(); next?.setSelectionRange(pos,pos); }); }
    const select=document.getElementById('classification-select');
    if(select){ select.addEventListener('change',e=>{ const item=getEmail(e.target.dataset.classify); if(item){item.classification=e.target.value;item.override=true;persist();render();toast('Responsibility updated. Your decision is saved.');} }); }
    const form=document.getElementById('ask-form');
    if(form) form.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('ask-input');const q=input.value.trim();if(!q)return;state.askAnswer=answerQuestion(q);render();const next=document.getElementById('ask-input');next?.focus();});
  }

  function answerQuestion(question) {
    const q=question.toLowerCase();
    const client=state.emails.filter(e=>!e.archived&&!e.done&&e.classification==='client_to_reply');
    const assistant=state.emails.filter(e=>!e.archived&&!e.done&&e.classification==='assistant_to_reply');
    const waiting=state.emails.filter(e=>!e.archived&&!e.done&&e.classification==='waiting_for_response');
    if(q.includes('client')||q.includes('attention')||q.includes('my attention')) return client.length ? `There ${client.length===1?'is':'are'} ${client.length} conversation${client.length===1?'':'s'} waiting for the client: ${client.map(e=>e.sender+' — '+e.subject).join('; ')}. These need a personal decision or approval.` : 'There are no client decisions waiting at the moment. The personal-attention list is clear.';
    if(q.includes('waiting')||q.includes('follow')) return waiting.length ? `You are waiting on ${waiting.length} response${waiting.length===1?'':'s'}: ${waiting.map(e=>e.sender+' — '+e.subject).join('; ')}. Keep these visible and follow up if the promised response does not arrive.` : 'There are no conversations currently marked as waiting for someone else.';
    if(q.includes('assistant')||q.includes('my reply')||q.includes('i need to reply')) return assistant.length ? `${assistant.length} conversation${assistant.length===1?' needs':'s need'} the assistant to reply. Start with ${assistant[0].sender}: ${assistant[0].action}` : 'Nothing is currently assigned to the assistant for a reply.';
    if(q.includes('summary')||q.includes('summarise')||q.includes('summarize')) {const e=getEmail(state.selectedId);return e?`${e.sender}: ${e.summary}`:'Select a conversation to see its summary.';}
    return `I found ${client.length} client decision${client.length===1?'':'s'}, ${assistant.length} assistant repl${assistant.length===1?'y':'ies'} and ${waiting.length} conversation${waiting.length===1?'':'s'} waiting on someone else. Try asking “What needs the client’s attention?” or “What am I waiting for?”`;
  }

  function selectFilter(filter) { state.activeFilter=filter; state.role='assistant'; const first=visibleEmails()[0]; state.selectedId=first?.id || null; state.sidebarOpen=false; render(); }
  function handleClick(target) {
    const role=target.closest('[data-role]'); if(role){state.role=role.dataset.role;state.modal=null;state.sidebarOpen=false;render();return;}
    const filter=target.closest('[data-filter]'); if(filter){selectFilter(filter.dataset.filter);return;}
    const stat=target.closest('[data-stat]'); if(stat){selectFilter(stat.dataset.stat);return;}
    const selected=target.closest('[data-select]'); if(selected){state.selectedId=selected.dataset.select;const e=getEmail(state.selectedId);if(e)e.unread=false;state.sidebarOpen=false;persist();render();return;}
    const provider=target.closest('[data-provider]');if(provider){const name=provider.dataset.provider;if(!state.connected.includes(name)){state.connected.push(name);persist();render();toast(`${name} demo account connected.`);}return;}
    const classify=target.closest('[data-action]'); if(!classify)return;
    const action=classify.dataset.action;const id=classify.dataset.id;const e=getEmail(id);
    if(action==='menu'||action==='menu-close'){state.sidebarOpen=action==='menu'?!state.sidebarOpen:false;render();return;}
    if(action==='connect'){state.modal={type:'connect'};render();return;}
    if(action==='settings'){state.modal={type:'settings'};render();return;}
    if(action==='close-modal'||(action==='backdrop'&&target===classify)){state.modal=null;render();return;}
    if(action==='close-detail'){state.selectedId=null;render();return;}
    if(action==='notifications'){toast('You’re all caught up on notifications.');return;}
    if(action==='workspace'){toast('Harper & Co. is your active demo workspace.');return;}
    if(action==='star'&&e){e.starred=!e.starred;e.important=e.starred;persist();render();return;}
    if(action==='read'&&e){e.unread=!e.unread;persist();render();toast(e.unread?'Marked as unread.':'Marked as read.');return;}
    if(action==='archive'&&e){e.archived=true;state.selectedId=null;persist();render();toast('Conversation moved to archive.');return;}
    if(action==='done'&&e){e.done=true;persist();render();toast('Marked as handled.');return;}
    if(action==='summary'&&e){toast('Summary is up to date for this demo conversation.');return;}
    if(action==='reanalyze'&&e){const text=e.messages.map(m=>m.text).join(' ').toLowerCase();let next='needs_review',confidence=62,reason='The conversation needs a human review because the next owner is not clear.',actionText='Review the thread and decide who should respond.';if(/approve|approval|decision|sign off|personally|your confirmation|budget|keynote title/.test(text)){next='client_to_reply';confidence=94;reason='The conversation asks for a personal decision or approval from the client.';actionText='Review the request and confirm the decision.';}else if(/schedule|reschedule|availability|invoice|calendar|meeting|time slot|acknowledge/.test(text)){next='assistant_to_reply';confidence=91;reason='This is routine coordination or administration that the assistant can handle.';actionText='Handle the coordination and reply on the client’s behalf.';}else if(/newsletter|digest|notification|automated|itinerary is confirmed/.test(text)){next='no_reply_needed';confidence=98;reason='This is informational content and does not request a response.';actionText='No action needed.';}e.classification=next;e.confidence=confidence;e.reason=reason;e.action=actionText;e.override=false;persist();render();toast('Thread reviewed. The suggested responsibility has been refreshed.');return;}
    if(action==='draft'&&e){state.modal={type:'draft',id:e.id,text:draftFor(e)};render();return;}
    if(action==='save-draft'&&e){const text=document.getElementById('draft-text')?.value||'';state.drafts.push({id:e.id,to:e.email,subject:e.subject,text,createdAt:new Date().toISOString()});persist();state.modal=null;render();toast('Draft saved in this browser. Nothing was sent.');return;}
    if(action==='client-open'&&e){state.modal={type:'client-detail',id:e.id};render();return;}
    if(action==='client-handle'&&e){e.done=true;e.clientStatus='handled';state.modal=null;persist();render();toast('Marked handled. Alex’s workspace is updated.');return;}
    if(action==='client-delegate'&&e){e.classification='assistant_to_reply';e.override=true;e.clientStatus='delegated';state.modal=null;persist();render();toast('Handed to Alex. The assistant inbox is updated.');return;}
    if(action==='simulate'){const demo={...seed[2],id:'demo-'+Date.now(),sender:'Avery from Little Oak',email:'avery@littleoak.co',initials:'AL',subject:'Quick question about next week',preview:'Would Tuesday afternoon work for a short planning call?',time:'Just now',date:'Today',classification:'assistant_to_reply',confidence:89,unread:true,starred:false,archived:false,done:false,important:false,summary:'Avery is asking to arrange a short planning call next week.',reason:'This is routine scheduling and can be handled by the assistant.',action:'Check availability and suggest a time.',messages:[{from:'Avery from Little Oak',time:'Just now',text:'Hi Alex — would Tuesday afternoon work for a short planning call? Happy to work around the calendar.'}]};state.emails.unshift(demo);state.activeFilter='all';state.selectedId=demo.id;persist();render();toast('A new sample conversation arrived.');return;}
    if(action==='reset-demo'){state.emails=seed;state.connected=[];state.drafts=[];state.activeFilter='all';state.selectedId='t1';state.search='';state.modal=null;persist();render();toast('Demo workspace reset.');return;}
  }

  app.addEventListener('click',e=>handleClick(e.target));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal){state.modal=null;render();}});
  render();
})();
