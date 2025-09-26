(function () {
    const csvInput = document.getElementById('csvInput');
    const importBtn = document.getElementById('importCsv');
    const templateBtn = document.getElementById('downloadTemplate');
    const preview = document.getElementById('csvPreview');
    const form = document.getElementById('issueForm');
    const wmBtn = document.getElementById('generateWatermark');
    const wmPrev = document.getElementById('watermarkPreview');

    function parseCSV(text) {
        // Simple CSV (no quotes/escapes), expecting commas
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.map(l => l.split(',').map(s => s.trim()))
        return rows;
    }

    function tableFromRows(rows) {
        if (!rows.length) return '';
        const head = rows[0];
        const body = rows.slice(1);
        const thead = '<thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
        const tbody = '<tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
        return `<table>${thead}${tbody}</table>`;
    }

    if (templateBtn) {
        templateBtn.addEventListener('click', () => {
            const csv = 'name,roll,certId,marks,issuer,issueDate,hash\nAisha Verma,21CS1234,CG-2023-000123,86.5%,ABC University,2023-06-15,0xabc123';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'certguard_template.csv'; a.click();
            URL.revokeObjectURL(url);
        });
    }

    let parsedRows = [];
    if (csvInput) {
        csvInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            file.text().then(txt => {
                parsedRows = parseCSV(txt);
                preview.innerHTML = tableFromRows(parsedRows);
            });
        });
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (!parsedRows.length) { CG.toast('No CSV loaded', 'error'); return; }
            const head = parsedRows[0];
            const idx = (h) => head.indexOf(h);
            const data = parsedRows.slice(1).map(r => ({
                name: r[idx('name')], roll: r[idx('roll')], certId: r[idx('certId')], marks: r[idx('marks')], issuer: r[idx('issuer')], issueDate: r[idx('issueDate')], hash: r[idx('hash')]
            })).filter(x => x.certId);
            const reg = CG.getRegistry();
            const merged = [...data, ...reg];
            CG.saveRegistry(merged);
            CG.toast(`Imported ${data.length} records`, 'success');
        });
    }

    // Real-time issuance
    function makeHash(certId) { return '0x' + Array.from(certId).map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 12); }
    function wmSvg({ name, roll, certId, issuer }) {
        const stamp = new Date().toISOString().slice(0, 10);
        return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs><rect width="100%" height="100%" fill="#0b1020"/><rect x="20" y="20" width="560" height="310" rx="12" fill="#131a2e" stroke="#223054"/><text x="40" y="60" fill="#e8eefc" font-size="20" font-family="Segoe UI, Roboto">${issuer} — Certificate</text><text x="40" y="110" fill="#a8b3cf" font-size="16">Name: ${name}</text><text x="40" y="140" fill="#a8b3cf" font-size="16">Roll: ${roll}</text><text x="40" y="170" fill="#a8b3cf" font-size="16">Cert ID: ${certId}</text><text x="40" y="200" fill="#a8b3cf" font-size="16">Issued: ${stamp}</text><g opacity="0.2"><text x="40" y="300" fill="url(#g)" font-size="48" font-weight="700">CERTGUARD</text></g><circle cx="520" cy="80" r="36" fill="none" stroke="url(#g)" stroke-width="4"/><text x="520" y="84" fill="#e8eefc" font-size="10" text-anchor="middle">WM</text></svg>`;
    }

    if (wmBtn) {
        wmBtn.addEventListener('click', () => {
            const data = {
                name: document.getElementById('i_name').value.trim(),
                roll: document.getElementById('i_roll').value.trim(),
                certId: document.getElementById('i_certId').value.trim(),
                marks: document.getElementById('i_marks').value.trim(),
                issuer: document.getElementById('i_issuer').value.trim()
            };
            const svg = wmSvg(data);
            wmPrev.innerHTML = svg;
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const rec = {
                name: document.getElementById('i_name').value.trim(),
                roll: document.getElementById('i_roll').value.trim(),
                certId: document.getElementById('i_certId').value.trim(),
                marks: document.getElementById('i_marks').value.trim(),
                issuer: document.getElementById('i_issuer').value.trim(),
                issueDate: new Date().toISOString().slice(0, 10),
                hash: makeHash(document.getElementById('i_certId').value.trim())
            };
            const reg = CG.getRegistry();
            if (reg.some(r => r.certId === rec.certId)) { CG.toast('Duplicate certificate ID', 'error'); return; }
            CG.saveRegistry([rec, ...reg]);
            CG.toast('Record added to registry', 'success');
        });
    }
})();

