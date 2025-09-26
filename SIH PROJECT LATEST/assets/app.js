(function () {
    const YEAR_EL = document.getElementById('year');
    if (YEAR_EL) YEAR_EL.textContent = String(new Date().getFullYear());

    // Theme
    const themeKey = 'cg_theme';
    const preferred = localStorage.getItem(themeKey) || 'dark';
    document.documentElement.setAttribute('data-theme', preferred);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.textContent = preferred === 'light' ? '🌙' : '☀️';
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', current);
            localStorage.setItem(themeKey, current);
            toggle.textContent = current === 'light' ? '🌙' : '☀️';
        });
    }

    // Privacy modal
    const privacyBtn = document.getElementById('privacyBtn');
    const privacyModal = document.getElementById('privacyModal');
    if (privacyBtn && privacyModal && privacyModal.showModal) {
        privacyBtn.addEventListener('click', () => privacyModal.showModal());
    }

    // Scroll reveal
    const reveal = () => {
        const els = document.querySelectorAll('[data-reveal]');
        const vh = window.innerHeight || 800;
        els.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < vh - 80) el.classList.add('reveal-in');
        });
    };
    window.addEventListener('scroll', reveal, { passive: true });
    window.addEventListener('load', () => {
        reveal();
        // Page transition effect for internal nav
        document.querySelectorAll('a[href$=".html"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const url = a.getAttribute('href');
                if (!url) return;
                e.preventDefault();
                document.body.style.transition = 'opacity .25s ease';
                document.body.style.opacity = '0';
                setTimeout(() => { window.location.href = url; }, 200);
            });
        });
    });

    // Simple store in localStorage
    const storeKey = 'cg_registry_v1';
    const blKey = 'cg_blacklist_v1';
    const alertsKey = 'cg_alerts_v1';

    function getJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function setJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

    // Seed mock registry if empty
    if (!localStorage.getItem(storeKey)) {
        const seed = [
            { name: 'Aisha Verma', roll: '21CS1234', certId: 'CG-2023-000123', marks: '86.5%', issuer: 'ABC University', issueDate: '2023-06-15', hash: '0xabc123' },
            { name: 'Rahul Singh', roll: '20ME0456', certId: 'CG-2022-011789', marks: '74%', issuer: 'XYZ College', issueDate: '2022-07-10', hash: '0xdef456' }
        ];
        setJSON(storeKey, seed);
    }
    if (!localStorage.getItem(blKey)) setJSON(blKey, []);
    if (!localStorage.getItem(alertsKey)) setJSON(alertsKey, []);

    // Toasts
    function toast(message, type) {
        const el = document.createElement('div');
        el.className = `toast ${type || ''}`.trim();
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2400);
        setTimeout(() => el.remove(), 2800);
    }

    // Expose simple API
    window.CG = {
        getRegistry: () => getJSON(storeKey, []),
        saveRegistry: (data) => setJSON(storeKey, data),
        getBlacklist: () => getJSON(blKey, []),
        saveBlacklist: (data) => setJSON(blKey, data),
        getAlerts: () => getJSON(alertsKey, []),
        pushAlert: (alert) => { const arr = getJSON(alertsKey, []); arr.unshift({ time: Date.now(), ...alert }); setJSON(alertsKey, arr.slice(0, 200)); },
        toast
    };
})();

