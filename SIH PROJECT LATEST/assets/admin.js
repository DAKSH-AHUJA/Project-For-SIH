(function () {
    function setStats() {
        const alerts = CG.getAlerts();
        const last24 = alerts.filter(a => Date.now() - a.time < 24*60*60*1000);
        document.getElementById('statTotal').textContent = String(last24.length);
        document.getElementById('statInvalid').textContent = String(last24.filter(a => a.type === 'INVALID').length);
        document.getElementById('statBlacklist').textContent = String(CG.getBlacklist().length);
    }

    function renderBar() {
        const alerts = CG.getAlerts();
        const days = Array.from({ length: 7 }, (_, i) => {
            const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - (6 - i));
            const end = new Date(start); end.setDate(start.getDate() + 1);
            const count = alerts.filter(a => a.time >= start.getTime() && a.time < end.getTime()).length;
            return { label: start.toISOString().slice(5,10), count };
        });
        const max = Math.max(1, ...days.map(d => d.count));
        const bars = days.map(d => `<g><rect x="0" y="0" width="28" height="${(d.count/max)*100}" rx="6" fill="url(#g)"/><text x="14" y="-6" text-anchor="middle" fill="currentColor" font-size="10">${d.count}</text><text x="14" y="16" text-anchor="middle" fill="currentColor" font-size="10">${d.label}</text></g>`);
        document.getElementById('chartBar').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 420 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs><g transform="translate(30,150) scale(1,-1)" fill="none" stroke="none">${bars.map((b,i)=>`<g transform="translate(${i*56},0)">${b}</g>`).join('')}</g></svg>`;
    }

    function renderPie() {
        const alerts = CG.getAlerts();
        const total = Math.max(1, alerts.length);
        const counts = { VALID: 0, WARN: 0, INVALID: 0 };
        alerts.forEach(a => { counts[a.type] = (counts[a.type]||0) + 1; });
        const parts = [
            { k: 'VALID', c: '#34d399' },
            { k: 'WARN', c: '#ffb86b' },
            { k: 'INVALID', c: '#ff6b6b' }
        ];
        let acc = 0; const r = 80; const cx = 110; const cy = 110;
        function arc(p) {
            const a0 = acc * 2 * Math.PI; acc += p; const a1 = acc * 2 * Math.PI;
            const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            const large = (a1 - a0) > Math.PI ? 1 : 0;
            return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
        }
        const slices = parts.map(p => {
            const pct = counts[p.k] / total; if (pct === 0) return '';
            return `<path d="${arc(pct)}" fill="${p.c}" opacity="0.85"><title>${p.k}: ${counts[p.k]}</title></path>`;
        }).join('');
        document.getElementById('chartPie').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 220 220">${slices}</svg>`;
    }

    function renderBlacklist() {
        const list = CG.getBlacklist();
        const rows = list.map((b, i) => `<tr><td>${b.entity}</td><td>${b.reason||''}</td><td><button data-i="${i}" class="btn">Remove</button></td></tr>`).join('');
        const table = `<table><thead><tr><th>Entity</th><th>Reason</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="3">No entries</td></tr>'}</tbody></table>`;
        const wrap = document.getElementById('blacklistTable');
        wrap.innerHTML = table;
        wrap.querySelectorAll('button[data-i]').forEach(btn => btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-i'));
            const data = CG.getBlacklist(); data.splice(idx,1); CG.saveBlacklist(data);
            CG.toast('Removed from blacklist', 'success');
            setStats(); renderBlacklist();
        }));
    }

    function bindForm() {
        const form = document.getElementById('blacklistForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const entity = document.getElementById('bl_entity').value.trim();
            const reason = document.getElementById('bl_reason').value.trim();
            if (!entity) { CG.toast('Enter entity', 'error'); return; }
            const list = CG.getBlacklist();
            if (list.some(l => (l.entity||'').toLowerCase() === entity.toLowerCase())) { CG.toast('Already blacklisted', 'warn'); return; }
            list.unshift({ entity, reason }); CG.saveBlacklist(list);
            CG.toast('Added to blacklist', 'success');
            (e.target).reset();
            setStats(); renderBlacklist();
        });
    }

    function renderAlerts() {
        const alerts = CG.getAlerts().slice(0, 20);
        const items = alerts.map(a => `<div class="item"><strong>${a.type}</strong> — ${a.message} <span style="opacity:.7">${new Date(a.time).toLocaleString()}</span></div>`).join('');
        document.getElementById('alerts').innerHTML = items || '<div class="item">No alerts</div>';
    }

    setStats(); renderBar(); renderPie(); renderBlacklist(); bindForm(); renderAlerts();
})();

