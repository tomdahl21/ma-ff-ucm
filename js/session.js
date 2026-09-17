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

  function freshState() {
    return {
      v: 1,
      pool: JSON.parse(JSON.stringify(SEED_POOL)),
      messages: [],
      activity: [],
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
      var name = pt ? pt.name : (patientName || patientId || 'patient');
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
