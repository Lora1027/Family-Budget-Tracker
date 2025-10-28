
import React, { useEffect, useMemo, useState } from "react";

/**
 * Family Budget Tracker (Bi-Weekly) — Single-File React App
 * ---------------------------------------------------------
 * ✅ Multi-user login (family/shared tracker via Family Code)
 * ✅ Name your tracker when creating it
 * ✅ Bi-weekly periods (pick an anchor payday)
 * ✅ Track Income, Expenses, Savings Goals, Emergency Fund
 * ✅ Simple, kid-friendly labels
 * ✅ LocalStorage only (no server needed)
 *
 * Tip: Share the Family Code with your family so they can "Join Family".
 */

// -----------------------------
// Utilities
// -----------------------------
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtMoney = (n) => (isNaN(n) ? "$0.00" : n.toLocaleString("en-CA", { style: "currency", currency: "CAD" }));

function parseISO(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

// Compute the start of a bi-weekly period that contains a given date, anchored on an "anchorDate".
function getPeriodForDate(date, anchorDate) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const a = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  // days between d and a
  const diffDays = Math.floor((d - a) / (1000 * 60 * 60 * 24));
  const offset = ((diffDays % 14) + 14) % 14; // keep positive
  const start = new Date(d);
  start.setDate(d.getDate() - offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 13); // 14-day window
  return { start, end };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(d) {
  return d.toISOString().slice(0, 10);
}


// Suggested defaults
const DEFAULT_EXPENSE_CATS = ["Rent/Mortgage","Groceries","Gas","Utilities","Internet/Phone","Kids/School","Health","Debt","Gifts","Fun"];
const DEFAULT_SAVINGS_GOALS = ["Emergency","Vacation","Gifts","Tuition","Car","Christmas","Home"];
// -----------------------------
// LocalStorage "DB"
// -----------------------------
const LS_KEYS = {
  users: "fb_users_v1", // { [email]: { name, email, pass, familyId } }
  trackers: "fb_trackers_v1", // { [familyId]: { id, name, anchorISO, members:[email], data:{ income:[], expenses:[], savings:[], emergency:[] } } }
  session: "fb_session_v1", // { email, familyId }
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// -----------------------------
// App
// -----------------------------
export default function FamilyBudgetApp() {
  const [users, setUsers] = useState(() => load(LS_KEYS.users, {}));
  const [trackers, setTrackers] = useState(() => load(LS_KEYS.trackers, {}));
  const [session, setSession] = useState(() => load(LS_KEYS.session, null));

  useEffect(() => save(LS_KEYS.users, users), [users]);
  useEffect(() => save(LS_KEYS.trackers, trackers), [trackers]);
  useEffect(() => save(LS_KEYS.session, session), [session]);

  const currentUser = session?.email ? users[session.email] : null;
  const currentTracker = session?.familyId ? trackers[session.familyId] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <h1 className="font-bold text-xl">Family Budget (Bi‑Weekly)</h1>
              <p className="text-xs text-slate-500">Simple. Shared. Kid-friendly.</p>
            </div>
          </div>
          {currentTracker && (
            <div className="text-right">
              <div className="font-semibold">{currentTracker.name}</div>
              <div className="text-xs text-slate-500">Family Code: <code className="bg-slate-100 px-1 rounded">{currentTracker.id}</code></div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!currentUser || !currentTracker ? (
          <AuthAndSetup users={users} setUsers={setUsers} trackers={trackers} setTrackers={setTrackers} setSession={setSession} />
        ) : (
          <Dashboard
            session={session}
            setSession={setSession}
            users={users}
            trackers={trackers}
            setTrackers={setTrackers}
          />
        )}
      </main>
      <footer className="max-w-5xl mx-auto px-4 pb-8 text-xs text-slate-500">
        <p>
          💡 Tip: Share your <b>Family Code</b> so others can <b>Join Family</b> from the login screen. Everything is saved on this device using Local Storage.
        </p>
      </footer>
    </div>
  );
}

// -----------------------------
// Auth + Setup
// -----------------------------
function AuthAndSetup({ users, setUsers, trackers, setTrackers, setSession }) {
  return (
    <div className="grid gap-4">
      <HelpCard />
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <h2 className="font-semibold text-lg">Sign In</h2>
          <p className="text-sm text-slate-500 mb-3">Use your email and password.</p>
          <LoginForm users={users} trackers={trackers} setSession={setSession} />
        </Card>
        <Card>
          <h2 className="font-semibold text-lg">Create New Family</h2>
          <p className="text-sm text-slate-500 mb-3">Pick a Tracker Name. Get a Family Code.</p>
          <CreateFamilyForm users={users} setUsers={setUsers} trackers={trackers} setTrackers={setTrackers} setSession={setSession} />
        </Card>
        <Card>
          <h2 className="font-semibold text-lg">Join Existing Family</h2>
          <p className="text-sm text-slate-500 mb-3">Enter the Family Code you were given.</p>
          <JoinFamilyForm users={users} setUsers={setUsers} trackers={trackers} setTrackers={setTrackers} setSession={setSession} />
        </Card>
      </div>
    </div>
  );
}

function HelpCard() {
  return (
    <Card>
      <h2 className="font-semibold text-lg mb-2">How this works (like I’m 7 🧒)</h2>
      <ol className="list-decimal pl-5 space-y-1 text-sm">
        <li>Make a family or join one with a code. (This is your shared piggy bank 🐷.)</li>
        <li>Name your tracker (like “Gabiana Family Budget”).</li>
        <li>Pick your <b>Payday Start</b> (the first day of your 2‑week money window).</li>
        <li>Add <b>Income</b> (money in) and <b>Expenses</b> (money out).</li>
        <li>Put some into <b>Savings</b> (goals) and your <b>Emergency Fund</b> (uh‑oh money).</li>
        <li>See the big number: <code>Income − Expenses − Savings − Emergency = Spending Money</code>.</li>
      </ol>
    </Card>
  );
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">{children}</div>
  );
}

function TextInput({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <label className="block text-sm mb-2">
      <span className="block text-slate-700 mb-1">{label}</span>
      <input
        type={type}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function LoginForm({ users, trackers, setSession }) {
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");

  function handleLogin(e) {
    e.preventDefault();
    const user = users[email];
    if (!user || user.pass !== pass) {
      alert("Wrong email or password.");
      return;
    }
    const familyId = user.familyId;
    if (!familyId || !trackers[familyId]) {
      alert("Your account exists but no family tracker was found. Please Create Family or Join Family.");
      return;
    }
    setSession({ email, familyId });
  }

  return (
    <form onSubmit={handleLogin} className="grid gap-2">
      <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@email.com" required />
      <TextInput label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" required />
      <button className="mt-1 w-full rounded-xl bg-sky-600 text-white py-2 font-semibold hover:bg-sky-700">Sign In</button>
    </form>
  );
}

function CreateFamilyForm({ users, setUsers, trackers, setTrackers, setSession }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [trackerName, setTrackerName] = React.useState("");
  const [anchorISO, setAnchorISO] = React.useState(todayISO());

  function handleCreate(e) {
    e.preventDefault();
    if (users[email]) {
      alert("That email already exists. Try signing in.");
      return;
    }
    const familyId = uid();

    const newUsers = { ...users, [email]: { name, email, pass, familyId } };
    const newTracker = {
      id: familyId,
      name: trackerName || "My Family Budget",
      anchorISO,
      members: [email],
      data: { income: [], expenses: [], savings: [], emergency: [] },
    };
    const newTrackers = { ...trackers, [familyId]: newTracker };

    setUsers(newUsers);
    setTrackers(newTrackers);
    setSession({ email, familyId });
  }

  return (
    <form onSubmit={handleCreate} className="grid gap-2">
      <TextInput label="Your Name" value={name} onChange={setName} placeholder="e.g., Mom" required />
      <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@email.com" required />
      <TextInput label="Password" type="password" value={pass} onChange={setPass} placeholder="Make it simple" required />
      <TextInput label="Tracker Name" value={trackerName} onChange={setTrackerName} placeholder="Gabiana Family Budget" required />
      <TextInput label="Payday Start (anchor)" type="date" value={anchorISO} onChange={setAnchorISO} required />
      <button className="mt-1 w-full rounded-xl bg-emerald-600 text-white py-2 font-semibold hover:bg-emerald-700">Create Family</button>
    </form>
  );
}

function JoinFamilyForm({ users, setUsers, trackers, setTrackers, setSession }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [familyId, setFamilyId] = React.useState("");

  function handleJoin(e) {
    e.preventDefault();
    if (users[email]) {
      alert("That email already exists. Try signing in.");
      return;
    }
    const tracker = trackers[familyId];
    if (!tracker) {
      alert("Family Code not found. Double-check the letters.");
      return;
    }
    const newUsers = { ...users, [email]: { name, email, pass, familyId } };
    const newTracker = { ...tracker, members: [...new Set([...(tracker.members || []), email])] };

    setUsers(newUsers);
    setTrackers({ ...trackers, [familyId]: newTracker });
    setSession({ email, familyId });
  }

  return (
    <form onSubmit={handleJoin} className="grid gap-2">
      <TextInput label="Your Name" value={name} onChange={setName} placeholder="e.g., Dad" required />
      <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@email.com" required />
      <TextInput label="Password" type="password" value={pass} onChange={setPass} placeholder="Make it simple" required />
      <TextInput label="Family Code" value={familyId} onChange={setFamilyId} placeholder="ask your family" required />
      <button className="mt-1 w-full rounded-xl bg-violet-600 text-white py-2 font-semibold hover:bg-violet-700">Join Family</button>
    </form>
  );
}

// -----------------------------
// Dashboard
// -----------------------------
function Dashboard({ session, setSession, users, trackers, setTrackers }) {
  const tracker = trackers[session.familyId];
  const [tab, setTab] = React.useState("overview");

  const anchor = React.useMemo(() => parseISO(tracker.anchorISO || todayISO()), [tracker.anchorISO]);
  const [viewDate, setViewDate] = React.useState(new Date());
  const period = React.useMemo(() => getPeriodForDate(viewDate, anchor), [viewDate, anchor]);

  const periodEntries = React.useMemo(() => filterEntriesByPeriod(tracker.data, period), [tracker.data, period]);
  const totals = React.useMemo(() => calcTotals(periodEntries), [periodEntries]);

  function updateTracker(patch) {
    const next = { ...trackers[tracker.id], ...patch };
    setTrackers({ ...trackers, [tracker.id]: next });
  }

  function addEntry(kind, entry) {
    const next = { ...tracker };
    next.data = { ...next.data, [kind]: [...next.data[kind], entry] };
    setTrackers({ ...trackers, [tracker.id]: next });
  }

  function deleteEntry(kind, id) {
    const next = { ...tracker };
    next.data = { ...next.data, [kind]: next.data[kind].filter((x) => x.id !== id) };
    setTrackers({ ...trackers, [tracker.id]: next });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Hello, {users[session.email]?.name}! 👋</h2>
            <p className="text-sm text-slate-500">Family Code: <code className="bg-slate-100 px-1 rounded">{tracker.id}</code></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => {
                const newName = prompt("Rename your tracker:", tracker.name) || tracker.name;
                updateTracker({ name: newName });
              }}
            >Rename Tracker</button>
            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => {
                const iso = prompt("Pick new Payday Start (YYYY-MM-DD):", tracker.anchorISO) || tracker.anchorISO;
                if (/^\\d{4}-\\d{2}-\\d{2}$/.test(iso)) updateTracker({ anchorISO: iso });
              }}
            >Set Payday Start</button>
            <button className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setSession(null)}>Log Out</button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <SummaryCard title="Income (this period)" value={fmtMoney(totals.income)} />
        <SummaryCard title="Expenses (this period)" value={fmtMoney(totals.expenses)} />
        <SummaryCard title="Saved (goals)" value={fmtMoney(totals.savings)} />
        <SummaryCard title="Emergency Put Aside" value={fmtMoney(totals.emergency)} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setViewDate(addDays(period.start, -1))}>◀ Previous</button>
          <div className="text-sm font-medium">{toISO(period.start)} → {toISO(period.end)}</div>
          <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setViewDate(addDays(period.end, 1))}>Next ▶</button>
          <button className="ml-auto rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setViewDate(new Date())}>Jump to Today</button>
        </div>
      </Card>

      <nav className="flex flex-wrap gap-2">
        {[
          ["overview", "Overview"],
          ["income", "Add Income"],
          ["expenses", "Add Expense"],
          ["savings", "Add Savings"],
          ["emergency", "Add Emergency"],
          ["history", "All Entries"],
          ["backup", "Backup / Restore"],
          ["report", "Bi-Weekly Report"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl border px-3 py-1.5 text-sm ${tab === key ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}
          >{label}</button>
        ))}
      </nav>

      {tab === "overview" && (
        <Overview periodEntries={periodEntries} totals={totals} deleteEntry={deleteEntry} users={users} />
      )}
      {tab === "income" && (
        <EntryForm kind="income" onAdd={addEntry} users={users} session={session} />
      )}
      {tab === "expenses" && (
        <EntryForm kind="expenses" onAdd={addEntry} users={users} session={session} />
      )}
      {tab === "savings" && (
        <EntryForm kind="savings" onAdd={addEntry} users={users} session={session} />
      )}
      {tab === "emergency" && (
        <EntryForm kind="emergency" onAdd={addEntry} users={users} session={session} />
      )}
      {tab === "history" && (
        <HistoryAll data={tracker.data} deleteEntry={deleteEntry} users={users} />
      )}
      {tab === "backup" && (
        <BackupRestore tracker={tracker} setTrackers={setTrackers} trackers={trackers} />
      )}
      {tab === "report" && (
        <ReportView periodEntries={periodEntries} totals={totals} period={period} tracker={tracker} />
      )}

      <Card>
        <h3 className="font-semibold mb-2">Spending Money (this period)</h3>
        <div className="text-2xl font-bold">{fmtMoney(totals.income - totals.expenses - totals.savings - totals.emergency)}</div>
        <p className="text-sm text-slate-500 mt-1">This is the simple kid math: money in minus all the jars.</p>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function filterEntriesByPeriod(data, period) {
  const inRange = (iso) => {
    const d = parseISO(iso);
    return d >= period.start && d <= period.end;
  };
  return {
    income: data.income.filter((e) => inRange(e.date)),
    expenses: data.expenses.filter((e) => inRange(e.date)),
    savings: data.savings.filter((e) => inRange(e.date)),
    emergency: data.emergency.filter((e) => inRange(e.date)),
  };
}

function calcTotals(periodEntries) {
  const sum = (arr) => arr.reduce((a, b) => a + (Number(b.amount) || 0), 0);
  return {
    income: sum(periodEntries.income),
    expenses: sum(periodEntries.expenses),
    savings: sum(periodEntries.savings),
    emergency: sum(periodEntries.emergency),
  };
}

// -----------------------------
// Views
// -----------------------------
function Overview({ periodEntries, totals, deleteEntry, users }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold mb-2">Income</h3>
        <List kind="income" rows={periodEntries.income} deleteEntry={deleteEntry} users={users} empty="No income yet." />
      </Card>
      <Card>
        <h3 className="font-semibold mb-2">Expenses</h3>
        <List kind="expenses" rows={periodEntries.expenses} deleteEntry={deleteEntry} users={users} empty="No expenses yet." />
      </Card>
      <Card>
        <h3 className="font-semibold mb-2">Savings (goals)</h3>
        <List kind="savings" rows={periodEntries.savings} deleteEntry={deleteEntry} users={users} empty="No savings yet." />
      </Card>
      <Card>
        <h3 className="font-semibold mb-2">Emergency Fund</h3>
        <List kind="emergency" rows={periodEntries.emergency} deleteEntry={deleteEntry} users={users} empty="No emergency deposits yet." />
      </Card>
    </div>
  );
}

function List({ kind, rows, deleteEntry, users, empty }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  const catHeader = kind === "expenses" ? "Category" : kind === "savings" ? "Goal" : kind === "income" ? "Source" : "Note";
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500 border-b">
          <tr>
            <th className="py-2">Date</th>
            <th className="py-2">Who</th>
            <th className="py-2">{catHeader}</th>
            <th className="py-2">Amount</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 align-top">{r.date}</td>
              <td className="py-2 align-top">{r.whoName || r.who || "—"}</td>
              <td className="py-2 align-top">{r.category || r.goal || r.source || r.note || "—"}</td>
              <td className="py-2 align-top font-semibold">{fmtMoney(Number(r.amount) || 0)}</td>
              <td className="py-2 align-top text-right">
                <button className="text-red-600 hover:underline" onClick={() => deleteEntry(kind, r.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryForm({ kind, onAdd, users, session }) {
  const me = users[session.email];
  const [date, setDate] = React.useState(todayISO());
  const [amount, setAmount] = React.useState("");
  const [who, setWho] = React.useState(session.email);
  const [source, setSource] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [note, setNote] = React.useState("");

  function submit(e) {
    e.preventDefault();
    const entry = { id: uid(), date, amount: Number(amount || 0), who, whoName: users[who]?.name || me.name };
    if (kind === "income") entry.source = source || "Pay";
    if (kind === "expenses") entry.category = category || "Other";
    if (kind === "savings") entry.goal = goal || "General";
    if (kind === "emergency") entry.note = note || "Deposit";
    onAdd(kind, entry);
    setAmount("");
  }

  const memberOptions = Object.values(users).filter((u) => u.familyId === me.familyId);

  return (
    <Card>
      <h3 className="font-semibold mb-2">{labelForKind(kind)}</h3>
      <form onSubmit={submit} className="grid md:grid-cols-5 gap-3 items-end">
        <TextInput label="Date" type="date" value={date} onChange={setDate} />
        <label className="block text-sm">
          <span className="block text-slate-700 mb-1">Who</span>
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={who} onChange={(e) => setWho(e.target.value)}>
            {memberOptions.map((u) => (
              <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
            ))}
          </select>
        </label>
        {kind === "income" && (
          <TextInput label="Source" value={source} onChange={setSource} placeholder="Pay / Tips / Other" />
        )}
        {kind === "expenses" && (
          <label className="block text-sm mb-2">\n        <span className="block text-slate-700 mb-1">Category</span>\n        <input list="expense-cats" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="Groceries / Gas / Rent / etc" />\n        <datalist id="expense-cats">\n          {DEFAULT_EXPENSE_CATS.map((c)=>(<option key={c} value={c} />))}\n        </datalist>\n      </label>
        )}
        {kind === "savings" && (
          <label className="block text-sm mb-2">\n        <span className="block text-slate-700 mb-1">Goal</span>\n        <input list="savings-goals" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={goal} onChange={(e)=>setGoal(e.target.value)} placeholder="Vacation / Tuition / Gifts" />\n        <datalist id="savings-goals">\n          {DEFAULT_SAVINGS_GOALS.map((g)=>(<option key={g} value={g} />))}\n        </datalist>\n      </label>
        )}
        {kind === "emergency" && (
          <TextInput label="Note" value={note} onChange={setNote} placeholder="Deposit / Car Fix / etc" />
        )}
        <TextInput label="Amount" type="number" value={amount} onChange={setAmount} placeholder="0.00" />
        <button className="md:col-span-5 rounded-xl bg-slate-900 text-white py-2 font-semibold hover:bg-slate-800">Add</button>
      </form>
    </Card>
  );
}

function labelForKind(kind) {
  switch (kind) {
    case "income":
      return "Add Income (Money In)";
    case "expenses":
      return "Add Expense (Money Out)";
    case "savings":
      return "Add to Savings (Goals)";
    case "emergency":
      return "Add to Emergency (Uh‑Oh Money)";
    default:
      return "Add";
  }
}

function HistoryAll({ data, deleteEntry, users }) {
  const all = [
    ...data.income.map((x) => ({ ...x, kind: "income" })),
    ...data.expenses.map((x) => ({ ...x, kind: "expenses" })),
    ...data.savings.map((x) => ({ ...x, kind: "savings" })),
    ...data.emergency.map((x) => ({ ...x, kind: "emergency" })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (!all.length) return <Card><p className="text-sm text-slate-500">No entries yet. Start adding above!</p></Card>;

  return (
    <Card>
      <h3 className="font-semibold mb-2">All Entries</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2">Who</th>
              <th className="py-2">Details</th>
              <th className="py-2">Amount</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 align-top">{r.date}</td>
                <td className="py-2 align-top capitalize">{r.kind}</td>
                <td className="py-2 align-top">{r.whoName || r.who}</td>
                <td className="py-2 align-top">{r.category || r.goal || r.source || r.note || "—"}</td>
                <td className="py-2 align-top font-semibold">{fmtMoney(Number(r.amount) || 0)}</td>
                <td className="py-2 align-top text-right"><button className="text-red-600 hover:underline" onClick={() => deleteEntry(r.kind, r.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BackupRestore({ tracker, trackers, setTrackers }) {
  function handleExport() {
    const blob = new Blob([JSON.stringify(tracker, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tracker.name.replace(/\\s+/g, "_")}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed?.id) throw new Error("Bad file");
        setTrackers({ ...trackers, [parsed.id]: parsed });
        alert("Imported! If this replaced your current family, re-login if needed.");
      } catch (err) {
        alert("Not a valid backup file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <Card>
      <h3 className="font-semibold mb-2">Backup / Restore</h3>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button className="rounded-xl border px-3 py-1.5 hover:bg-slate-50" onClick={handleExport}>Download Backup</button>
        <label className="inline-flex items-center gap-2">
          <span className="rounded-xl border px-3 py-1.5 hover:bg-slate-50 cursor-pointer">Upload Backup</span>
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
        <p className="text-slate-500">(This only saves on your device. For multi-device, import your backup elsewhere.)</p>
      </div>
    </Card>
  );
}


function ReportView({ periodEntries, totals, period, tracker }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3 print:block">
        <div>
          <h3 className="font-semibold text-lg">Bi-Weekly Report</h3>
          <p className="text-sm text-slate-500">{toISO(period.start)} → {toISO(period.end)} • {tracker.name}</p>
        </div>
        <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50 print:hidden" onClick={()=>window.print()}>Print Report</button>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <SummaryCard title="Income" value={fmtMoney(totals.income)} />
        <SummaryCard title="Expenses" value={fmtMoney(totals.expenses)} />
        <SummaryCard title="Saved" value={fmtMoney(totals.savings)} />
        <SummaryCard title="Emergency" value={fmtMoney(totals.emergency)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section>
          <h4 className="font-semibold mb-2">Income</h4>
          <MiniTable rows={periodEntries.income} labelKey="source" fallback="Source" />
        </section>
        <section>
          <h4 className="font-semibold mb-2">Expenses</h4>
          <MiniTable rows={periodEntries.expenses} labelKey="category" fallback="Category" />
        </section>
        <section>
          <h4 className="font-semibold mb-2">Savings</h4>
          <MiniTable rows={periodEntries.savings} labelKey="goal" fallback="Goal" />
        </section>
        <section>
          <h4 className="font-semibold mb-2">Emergency Fund</h4>
          <MiniTable rows={periodEntries.emergency} labelKey="note" fallback="Note" />
        </section>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Spending Money</h4>
        <div className="text-xl font-bold">{fmtMoney(totals.income - totals.expenses - totals.savings - totals.emergency)}</div>
      </div>

      <style>{`
        @media print {
          .print\\:block { display: block !important; }
          button { display: none !important; }
          header, nav, footer { display: none !important; }
          .rounded-2xl, .rounded-xl { box-shadow: none !important; border: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </Card>
  );
}

function MiniTable({ rows, labelKey, fallback }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No items.</p>;
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500 border-b">
          <tr>
            <th className="py-2">Date</th>
            <th className="py-2">Who</th>
            <th className="py-2">{fallback}</th>
            <th className="py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 align-top">{r.date}</td>
              <td className="py-2 align-top">{r.whoName || r.who || "—"}</td>
              <td className="py-2 align-top">{r[labelKey] || "—"}</td>
              <td className="py-2 align-top font-semibold">{fmtMoney(Number(r.amount) || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

