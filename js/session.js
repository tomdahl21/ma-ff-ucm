/* ═══════════════════════════════════════════════════════
   UCM CARE COORDINATION — SHARED SESSION LAYER

   Carries manager actions (assignment, messaging, priority
   flags) into the coordinator's view, and coordinator actions
   back into the manager's activity feed.

   Prototype only. Production requires a real-time backend —
   Salesforce Platform Events or equivalent. See decision D-010.
═══════════════════════════════════════════════════════ */

(function (global) {
  'use strict';

  var KEY = 'ucm.session.v1';
  var CHANNEL = 'ucm-session';

  /* ─── Roster ─────────────────────────────────────── */
  var COORDINATORS = [
    { id: 'sarah',   name: 'Sarah Lin, RN',      short: 'Sarah Lin',   load: 18, cap: 15, team: 'Post-Discharge A' },
    { id: 'marcus',  name: 'Marcus Webb, RN',    short: 'Marcus Webb', load: 14, cap: 15, team: 'Post-Discharge A' },
    { id: 'denise',  name: 'Denise Kaur, LCSW',  short: 'Denise Kaur', load: 12, cap: 15, team: 'Social Work' },
    { id: 'anthony', name: 'Anthony Russo, RN',  short: 'Anthony Russo', load: 16, cap: 15, team: 'Post-Discharge B' },
    { id: 'priya',   name: 'Priya Raman, RN',    short: 'Priya Raman', load: 11, cap: 15, team: 'Post-Discharge B' },
    { id: 'gerald',  name: 'Gerald Okafor, LCSW',short: 'Gerald Okafor', load: 9, cap: 15, team: 'Social Work', away: true }
  ];

  var MANAGER = { id: 'james', name: 'James Porter', role: 'Manager, Care Coordination' };

  /* The unassigned pool. Manager assigns from here; assigned
     patients appear in that coordinator's queue. */
  var SEED_POOL = [
    { id: 'p-vaughn',  name: 'Patricia Vaughn', mrn: '8813402', age: 71, sex: 'F',
      dx: 'CHF Exacerbation', score: 88, tier: 'high', hoursSince: 51,
      epicPts: 52, sfdcPts: 36, contacted: false, assignedTo: null },
    { id: 'p-coleman', name: 'Andre Coleman',   mrn: '5529118', age: 64, sex: 'M',
      dx: 'Sepsis Recovery', score: 85, tier: 'high', hoursSince: 44,
      epicPts: 55, sfdcPts: 30, contacted: false, assignedTo: null },
    { id: 'p-jimenez', name: 'Rosa Jiménez',    mrn: '3390771', age: 68, sex: 'F',
      dx: 'COPD', score: 82, tier: 'high', hoursSince: 38,
      epicPts: 48, sfdcPts: 34, contacted: false, assignedTo: null },
    { id: 'p-braxton', name: 'Keith Braxton',   mrn: '7742019', age: 59, sex: 'M',
      dx: 'Diabetic Ketoacidosis', score: 79, tier: 'high', hoursSince: 31,
      epicPts: 44, sfdcPts: 35, contacted: false, assignedTo: null },
    { id: 'p-whitaker',name: 'Eleanor Whitaker',mrn: '2201947', age: 77, sex: 'F',
      dx: 'Pneumonia', score: 76, tier: 'high', hoursSince: 27,
      epicPts: 46, sfdcPts: 30, contacted: false, assignedTo: null },
    { id: 'p-santos',  name: 'Miguel Santos',   mrn: '6638210', age: 63, sex: 'M',
      dx: 'CHF Exacerbation', score: 75, tier: 'high', hoursSince: 22,
      epicPts: 47, sfdcPts: 28, contacted: false, assignedTo: null },
    { id: 'p-dunlap',  name: 'Brenda Dunlap',   mrn: '9917305', age: 70, sex: 'F',
      dx: 'Post-Op Cardiac', score: 73, tier: 'high', hoursSince: 19,
      epicPts: 43, sfdcPts: 30, contacted: false, assignedTo: null }
  ];

  /* ─── Established caseload ───────────────────────────
     Patients already owned by a coordinator. Read-only
     reference data for the manager's roster views — the
     delegation loop runs off SEED_POOL above.
     Columns: name, mrn, age, sex, dx, score, coordId, daysSince, lastOutcome */
  var ROSTER_RAW = [
    ['Darnell Washington','4820193',67,'M','CHF Exacerbation',88,'sarah',3,null],
    ['Robert Osei','7730021',72,'M','Sepsis Recovery',84,'sarah',1,null],
    ['Gloria Mensah','2214870',79,'F','COPD Exacerbation',81,'sarah',2,'Left voicemail'],
    ['Curtis Bell','9081234',58,'M','Diabetic Ketoacidosis',77,'sarah',4,'Reached'],
    ['Maria Okonkwo','3310485',54,'F','COPD',62,'sarah',7,'Reached'],
    ['Thomas Nguyen','6612098',61,'M','Post-Op Cardiac',58,'sarah',5,'Reached'],
    ['Yolanda Pierce','4471102',48,'F','Cellulitis',51,'sarah',6,'Reached'],
    ['Angela Torres','5540882',44,'F','Appendectomy',22,'sarah',5,'Reached'],
    ['Michael Adeyemi','1129334',39,'M','Laceration Repair',17,'sarah',8,'Reached'],

    ['Wanda Blackwell','8820114',74,'F','CHF Exacerbation',86,'marcus',2,'Left voicemail'],
    ['Hector Ramirez','5510298',69,'M','Pneumonia',80,'marcus',3,'Reached'],
    ['Deborah Chen','7719023',66,'F','Acute Kidney Injury',78,'marcus',1,null],
    ['Leonard Pike','3348871',71,'M','GI Bleed',74,'marcus',4,'Reached'],
    ['Sandra Whitfield','9902143',57,'F','COPD',64,'marcus',6,'Reached'],
    ['Omar Haddad','2264490',52,'M','Afib',55,'marcus',5,'Reached'],
    ['Janet Kowalski','6673321',60,'F','Post-Op Orthopedic',43,'marcus',7,'Reached'],
    ['Terrence Boyd','4419087',41,'M','Asthma',28,'marcus',9,'Reached'],

    ['Ruth Ellery','7761200',83,'F','Stroke / TIA',91,'denise',2,'Reached'],
    ['Clarence Muhammad','5583012',78,'M','CHF Exacerbation',87,'denise',3,'Reached'],
    ['Pearl Dominguez','3392218',80,'F','Sepsis Recovery',85,'denise',1,'Reached'],
    ['Vernon Ashby','8817745',75,'M','COPD Exacerbation',83,'denise',4,'Reached'],
    ['Ida Nkemelu','2209983',72,'F','Acute Kidney Injury',79,'denise',5,'Left voicemail'],
    ['Stanley Grubbs','6640021',68,'M','Diabetic Ketoacidosis',76,'denise',2,'Reached'],
    ['Loretta Sims','4472290',81,'F','Pneumonia',75,'denise',6,'Reached'],
    ['Eugene Tran','9938104',64,'M','GI Bleed',59,'denise',8,'Reached'],

    ['Frances Okoro','5529940',76,'F','CHF Exacerbation',89,'anthony',3,null],
    ['Dale Hutchins','7714488',70,'M','Sepsis Recovery',82,'anthony',2,null],
    ['Bernice Colvin','3361027',73,'F','COPD Exacerbation',80,'anthony',4,null],
    ['Ricardo Peña','8843319',65,'M','Pneumonia',78,'anthony',1,null],
    ['Marlene Shaw','2287701',69,'F','Acute Kidney Injury',76,'anthony',5,'Left voicemail'],
    ['Alvin Brooks','6619940',62,'M','Post-Op Cardiac',75,'anthony',3,null],
    ['Constance Yu','4490128',56,'F','Afib',61,'anthony',7,'Reached'],
    ['Darryl Means','9971203',50,'M','Cellulitis',47,'anthony',6,'Reached'],
    ['Hollis Barnett','5504417',45,'M','Appendectomy',24,'anthony',9,'Reached'],

    ['Estelle Rivers','7742891',77,'F','CHF Exacerbation',84,'priya',2,'Reached'],
    ['Nathaniel Park','3319974',71,'M','COPD',73,'priya',4,'Reached'],
    ['Juanita Delgado','8871140',67,'F','Pneumonia',68,'priya',3,'Reached'],
    ['Wesley Frazier','2230018',59,'M','Diabetic Ketoacidosis',57,'priya',6,'Reached'],
    ['Charlotte Ibe','6690273',53,'F','Post-Op Orthopedic',45,'priya',5,'Reached'],
    ['Simon Kowalczyk','4438852',47,'M','Asthma',31,'priya',8,'Reached'],
    ['Renee Caldwell','9917740',42,'F','Laceration Repair',19,'priya',10,'Reached'],

    ['Mildred Anyanwu','5567103',85,'F','Stroke / TIA',90,'gerald',3,'Reached'],
    ['Percy Lattimore','7798821',79,'M','CHF Exacerbation',81,'gerald',5,'Left voicemail'],
    ['Geneva Suarez','3374460',74,'F','Sepsis Recovery',77,'gerald',4,'Reached'],
    ['Otis Mbeki','8829015',70,'M','COPD Exacerbation',72,'gerald',6,'Reached'],
    ['Roberta Finch','2251199',63,'F','Acute Kidney Injury',54,'gerald',7,'Reached'],
    ['Andre Whitlock','6604428',55,'M','Afib',38,'gerald',9,'Reached']
  ];

  var DEFAULT_SETTINGS = {
    highThreshold: 75,
    mediumThreshold: 40,
    contactWindowHours: 48,
    defaultCapacity: 15,
    autoAssignEnabled: true,
    notifyOnUnassigned: true
  };

  function tierFor(score, s) {
    s = s || DEFAULT_SETTINGS;
    if (score >= s.highThreshold) return 'high';
    if (score >= s.mediumThreshold) return 'medium';
    return 'low';
  }

  var ROSTER = ROSTER_RAW.map(function (r, i) {
    return {
      id: 'r-' + i,
      name: r[0], mrn: r[1], age: r[2], sex: r[3], dx: r[4],
      score: r[5], assignedTo: r[6], daysSince: r[7],
      hoursSince: r[7] * 24,
      lastOutcome: r[8],
      contacted: !!r[8],
      fromPool: false
    };
  });

  function freshState() {
    return {
      v: 1,
      pool: JSON.parse(JSON.stringify(SEED_POOL)),
      messages: [],
      activity: [],
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      alerts: [{
        id: 'alert-washington',
        patientId: 'washington',
        patientName: 'Darnell Washington',
        type: 'repeat-ed-encounter',
        active: true,
        createdAt: Date.now(),
        epicMessage: 'Epic chart alert: patient returned to the ED within 30 days after prior high-risk discharge triage; same-day outreach is required.',
        portalMessage: 'Care coordination portal alert: Darnell Washington reappeared in the ED and requires same-day follow-up.'
      }],
      startedAt: Date.now()
    };
  }

  /* ─── Storage (degrades to memory if blocked) ────── */
  var memory = null;
  var storageOK = (function () {
    try {
      global.localStorage.setItem('__ucm_probe', '1');
      global.localStorage.removeItem('__ucm_probe');
      return true;
    } catch (e) { return false; }
  })();

  function read() {
    if (!storageOK) return memory || (memory = freshState());
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) { var s = freshState(); write(s); return s; }
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) { var f = freshState(); write(f); return f; }
      // Forward-fill fields added after a session was already stored
      if (!parsed.settings) parsed.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      if (!parsed.activity) parsed.activity = [];
      if (!parsed.messages) parsed.messages = [];
      if (!parsed.alerts) parsed.alerts = [];
      return parsed;
    } catch (e) {
      return memory || (memory = freshState());
    }
  }

  function write(state) {
    if (!storageOK) { memory = state; return; }
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { memory = state; }
  }

  /* ─── Pub/sub, including cross-tab ───────────────── */
  var listeners = [];
  var bc = null;
  try { bc = new global.BroadcastChannel(CHANNEL); } catch (e) { bc = null; }

  function emit(evt) {
    var state = read();
    listeners.forEach(function (fn) {
      try { fn(state, evt); } catch (e) { console.error(e); }
    });
  }

  function broadcast(evt) {
    if (bc) { try { bc.postMessage(evt); } catch (e) {} }
  }

  if (bc) {
    bc.onmessage = function (e) { emit(e.data || { type: 'sync', remote: true }); };
  }

  // storage event fires in OTHER tabs — this is what makes the
  // manager→coordinator handoff visible live during a demo.
  global.addEventListener('storage', function (e) {
    if (e.key === KEY) emit({ type: 'sync', remote: true });
  });

  function commit(state, evt) {
    write(state);
    emit(evt);
    broadcast(evt);
  }

  /* ─── Helpers ────────────────────────────────────── */
  function uid(p) { return p + '-' + Math.random().toString(36).slice(2, 9); }

  function coordinator(id) {
    for (var i = 0; i < COORDINATORS.length; i++) {
      if (COORDINATORS[i].id === id) return COORDINATORS[i];
    }
    return null;
  }

  function relTime(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return s + 's ago';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  function logActivity(state, actorName, verb, detail, patientId) {
    state.activity.unshift({
      id: uid('a'), ts: Date.now(),
      actorName: actorName, verb: verb, detail: detail, patientId: patientId || null
    });
    state.activity = state.activity.slice(0, 60);
  }

  /* ─── Public API ─────────────────────────────────── */
  var API = {
    COORDINATORS: COORDINATORS,
    MANAGER: MANAGER,
    relTime: relTime,
    coordinator: coordinator,
    storageAvailable: storageOK,

    getState: read,

    /** Patients currently in the unassigned pool. */
    unassigned: function () {
      return read().pool.filter(function (p) { return !p.assignedTo; });
    },

    /** Patients assigned to a given coordinator during this session. */
    assignedTo: function (coordId) {
      return read().pool.filter(function (p) { return p.assignedTo === coordId; });
    },

    /** Messages addressed to a coordinator, newest first. */
    inbox: function (coordId) {
      return read().messages
        .filter(function (m) { return m.to === coordId; })
        .sort(function (a, b) { return b.ts - a.ts; });
    },

    unreadCount: function (coordId) {
      return read().messages.filter(function (m) {
        return m.to === coordId && !m.read;
      }).length;
    },

    activity: function () { return read().activity; },

    reentryAlert: function (patientId) {
      var state = read();
      var alerts = (state.alerts || []).filter(function (a) {
        return a.patientId === patientId && a.active !== false;
      });
      if (!alerts.length) return null;
      alerts.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      return alerts[0];
    },

    recordEDReentry: function (patientId, coordId, opts) {
      opts = opts || {};
      var state = read();
      var patientName = opts.patientName || null;
      var pt = null;
      for (var i = 0; i < state.pool.length; i++) {
        if (state.pool[i].id === patientId) { pt = state.pool[i]; break; }
      }
      if (!patientName && pt) patientName = pt.name;
      if (!patientName && coordId) {
        var rosterMatch = ROSTER.filter(function (p) { return p.id === patientId; })[0];
        if (rosterMatch) patientName = rosterMatch.name;
      }
      var alert = {
        id: uid('alert'),
        patientId: patientId,
        patientName: patientName || patientId,
        type: 'repeat-ed-encounter',
        active: true,
        createdAt: Date.now(),
        epicMessage: opts.epicMessage || 'Epic chart alert: patient returned to the ED after prior readmission triage involvement; escalation is required.',
        portalMessage: opts.portalMessage || 'Care coordination portal alert: same-day follow-up required for repeat ED re-entry.'
      };
      state.alerts = (state.alerts || []).filter(function (a) { return a.patientId !== patientId; });
      state.alerts.unshift(alert);
      if (pt) pt.reentryAlert = alert;
      var co = coordinator(coordId);
      if (coordId && co) {
        state.messages.unshift({
          id: uid('m'), ts: Date.now(),
          from: MANAGER.id, fromName: MANAGER.name,
          to: coordId,
          patientId: patientId,
          patientName: alert.patientName,
          kind: 'message',
          priority: true,
          body: alert.portalMessage,
          read: false
        });
      }
      logActivity(state, co ? co.short : 'Epic', 'flagged ED re-entry',
        alert.patientName + ' — repeat ED encounter after prior triage', patientId);
      commit(state, { type: 'reentry-alert', patientId: patientId, coordId: coordId || null });
      return alert;
    },

    settings: function () { return read().settings; },

    updateSettings: function (patch) {
      var state = read();
      Object.keys(patch).forEach(function (k) { state.settings[k] = patch[k]; });
      logActivity(state, MANAGER.name, 'updated settings',
        Object.keys(patch).join(', '), null);
      commit(state, { type: 'settings', patch: patch });
      return state.settings;
    },

    tierFor: function (score) { return tierFor(score, read().settings); },

    /** Established caseload — read-only reference data. */
    roster: function () { return ROSTER; },

    /** Everything the manager oversees: established caseload + session pool. */
    allPatients: function () {
      var state = read();
      var s = state.settings;
      var pool = state.pool.map(function (p) {
        return {
          id: p.id, name: p.name, mrn: p.mrn, age: p.age, sex: p.sex, dx: p.dx,
          score: p.score, assignedTo: p.assignedTo,
          daysSince: Math.floor(p.hoursSince / 24), hoursSince: p.hoursSince,
          lastOutcome: p.lastOutcome || null, contacted: !!p.contacted,
          acknowledged: !!p.acknowledged, fromPool: true
        };
      });
      return ROSTER.concat(pool).map(function (p) {
        p.tier = tierFor(p.score, s);
        return p;
      });
    },

    /** Per-coordinator caseload rollup derived from allPatients(). */
    caseloads: function () {
      var all = API.allPatients();
      var s = read().settings;
      return COORDINATORS.map(function (c) {
        var mine = all.filter(function (p) { return p.assignedTo === c.id; });
        var high = mine.filter(function (p) { return p.tier === 'high'; });
        var uncontacted = mine.filter(function (p) { return !p.contacted; });
        var within = mine.filter(function (p) {
          return p.contacted && p.hoursSince <= s.contactWindowHours;
        });
        var eligible = mine.filter(function (p) {
          return p.hoursSince >= s.contactWindowHours;
        });
        var rate = eligible.length
          ? Math.round((eligible.filter(function (p) { return p.contacted; }).length /
              eligible.length) * 100)
          : null;
        return {
          coord: c,
          total: mine.length,
          high: high.length,
          uncontacted: uncontacted.length,
          withinWindow: within.length,
          contactRate: rate,
          capacity: s.defaultCapacity,
          overBy: Math.max(0, mine.length - s.defaultCapacity),
          patients: mine
        };
      });
    },

    /** Suggest the best coordinator for a patient: lowest load, not away. */
    suggestCoordinator: function () {
      var loads = API.caseloads().filter(function (c) { return !c.coord.away; });
      loads.sort(function (a, b) { return a.total - b.total; });
      return loads.length ? loads[0].coord.id : 'sarah';
    },

    /** Assign every unassigned patient by load balancing. */
    autoAssignAll: function () {
      var pool = API.unassigned();
      var results = [];
      pool.forEach(function (p) {
        var target = API.suggestCoordinator();
        var r = API.assign(p.id, target, { priority: true });
        if (r) results.push({ patient: r, coordId: target });
      });
      return results;
    },

    /* ── Manager actions ─────────────────────────── */

    /** Assign an unassigned patient to a coordinator. */
    assign: function (patientId, coordId, opts) {
      opts = opts || {};
      var state = read();
      var pt = null;
      for (var i = 0; i < state.pool.length; i++) {
        if (state.pool[i].id === patientId) { pt = state.pool[i]; break; }
      }
      if (!pt || pt.assignedTo) return null;

      var co = coordinator(coordId);
      if (!co) return null;

      pt.assignedTo = coordId;
      pt.assignedAt = Date.now();
      pt.assignedBy = MANAGER.name;
      pt.priority = !!opts.priority;

      state.messages.unshift({
        id: uid('m'), ts: Date.now(),
        from: MANAGER.id, fromName: MANAGER.name,
        to: coordId,
        patientId: pt.id, patientName: pt.name,
        kind: 'assignment',
        priority: !!opts.priority,
        body: opts.note || (
          'Assigning ' + pt.name + ' to you — high risk (score ' + pt.score +
          '), ' + pt.hoursSince + ' hours post-discharge and never contacted. ' +
          'Please make contact today.'
        ),
        read: false
      });

      logActivity(state, MANAGER.name, 'assigned',
        pt.name + ' → ' + co.short, pt.id);

      commit(state, { type: 'assign', patientId: pt.id, coordId: coordId });
      return pt;
    },

    /** Send a direct message to a coordinator. */
    message: function (coordId, body, opts) {
      opts = opts || {};
      if (!body || !coordinator(coordId)) return null;
      var state = read();
      var msg = {
        id: uid('m'), ts: Date.now(),
        from: MANAGER.id, fromName: MANAGER.name,
        to: coordId,
        patientId: opts.patientId || null,
        patientName: opts.patientName || null,
        kind: 'message',
        priority: !!opts.priority,
        body: body,
        read: false
      };
      state.messages.unshift(msg);
      logActivity(state, MANAGER.name, 'messaged',
        coordinator(coordId).short + ' — "' + body.slice(0, 60) +
        (body.length > 60 ? '…' : '') + '"', opts.patientId);
      commit(state, { type: 'message', coordId: coordId, messageId: msg.id });
      return msg;
    },

    /** Return an assigned patient to the unassigned pool. */
    unassign: function (patientId) {
      var state = read();
      var pt = null;
      for (var i = 0; i < state.pool.length; i++) {
        if (state.pool[i].id === patientId) { pt = state.pool[i]; break; }
      }
      if (!pt || !pt.assignedTo) return null;
      var prev = coordinator(pt.assignedTo);
      pt.assignedTo = null;
      pt.assignedAt = null;
      logActivity(state, MANAGER.name, 'unassigned',
        pt.name + ' from ' + (prev ? prev.short : 'coordinator'), pt.id);
      commit(state, { type: 'unassign', patientId: pt.id });
      return pt;
    },

    /* ── Coordinator actions ─────────────────────── */

    /** Log a call outcome. Propagates to the manager activity feed.
        patientName covers baseline-caseload patients, who live in the
        coordinator's view rather than the assignable pool. */
    logCall: function (patientId, coordId, outcome, note, patientName) {
      var state = read();
      var pt = null;
      for (var i = 0; i < state.pool.length; i++) {
        if (state.pool[i].id === patientId) { pt = state.pool[i]; break; }
      }
      var co = coordinator(coordId);
      // Prefer the pool record, then an explicitly passed name, then the
      // established-caseload roster. Manager-side callers have the roster
      // available and pass no name; coordinator-side callers pass one.
      var name = pt ? pt.name : (patientName || (function () {
        for (var j = 0; j < ROSTER.length; j++) {
          if (ROSTER[j].id === patientId) return ROSTER[j].name;
        }
        return null;
      })() || patientId || 'patient');
      if (pt) {
        pt.contacted = true;
        pt.lastOutcome = outcome;
        pt.lastContactAt = Date.now();
      }
      logActivity(state, co ? co.short : 'Coordinator', 'logged call',
        name + ' — ' + outcome + (note ? ' · ' + note.slice(0, 50) : ''), patientId);
      commit(state, { type: 'call', patientId: patientId, outcome: outcome });
      return true;
    },

    /** Acknowledge a message. */
    markRead: function (messageId) {
      var state = read();
      var found = false;
      state.messages.forEach(function (m) {
        if (m.id === messageId && !m.read) { m.read = true; found = true; }
      });
      if (!found) return false;
      commit(state, { type: 'read', messageId: messageId });
      return true;
    },

    markAllRead: function (coordId) {
      var state = read();
      state.messages.forEach(function (m) {
        if (m.to === coordId) m.read = true;
      });
      commit(state, { type: 'read-all', coordId: coordId });
    },

    /** Acknowledge an assignment back to the manager. */
    acknowledge: function (patientId, coordId) {
      var state = read();
      var co = coordinator(coordId);
      var pt = null;
      for (var i = 0; i < state.pool.length; i++) {
        if (state.pool[i].id === patientId) { pt = state.pool[i]; break; }
      }
      if (pt) pt.acknowledged = true;
      logActivity(state, co ? co.short : 'Coordinator', 'acknowledged',
        'assignment of ' + (pt ? pt.name : patientId), patientId);
      commit(state, { type: 'ack', patientId: patientId });
    },

    /* ── Lifecycle ───────────────────────────────── */

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (f) { return f !== fn; });
      };
    },

    reset: function () {
      var s = freshState();
      commit(s, { type: 'reset' });
      return s;
    },

    /* ── Toast ───────────────────────────────────── */
    toast: function (title, body, kind) {
      var host = document.querySelector('.toast-host');
      if (!host) {
        host = document.createElement('div');
        host.className = 'toast-host';
        document.body.appendChild(host);
      }
      var el = document.createElement('div');
      el.className = 'toast toast--' + (kind || 'info');
      el.innerHTML =
        '<div class="toast__bar"></div>' +
        '<div class="toast__body">' +
          '<div class="toast__title"></div>' +
          '<div class="toast__text"></div>' +
        '</div>' +
        '<button class="toast__close" aria-label="Dismiss">×</button>';
      el.querySelector('.toast__title').textContent = title;
      el.querySelector('.toast__text').textContent = body || '';
      host.appendChild(el);

      var kill = function () {
        el.classList.add('toast--out');
        setTimeout(function () { el.remove(); }, 240);
      };
      el.querySelector('.toast__close').addEventListener('click', kill);
      setTimeout(kill, 7000);
      requestAnimationFrame(function () { el.classList.add('toast--in'); });
    }
  };

  global.UCM = API;

})(window);
