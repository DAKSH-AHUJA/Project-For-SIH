(function () {
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const preview = document.getElementById('preview');
    const mockBtn = document.getElementById('mockOcr');
    const form = document.getElementById('ocrForm');
    const results = document.getElementById('results');

    function showPreview(file) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith('image/')) {
            preview.innerHTML = `<img alt="preview" src="${url}">`;
        } else {
            preview.innerHTML = `<div class="badge">PDF selected: ${file.name}</div>`;
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            showPreview(e.target.files[0]);
        });
    }
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(255,255,255,0.05)'; });
        dropzone.addEventListener('dragleave', () => { dropzone.style.background = ''; });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault(); dropzone.style.background = '';
            const f = e.dataTransfer.files[0];
            fileInput.files = e.dataTransfer.files; // mirror
            showPreview(f);
        });
    }

    // Mock OCR: simple heuristics using random/seed data
    function mockOcrFill() {
        const samples = CG.getRegistry();
        const chosen = samples[Math.floor(Math.random() * samples.length)] || samples[0];
        document.getElementById('name').value = chosen?.name || 'Sample Name';
        document.getElementById('roll').value = chosen?.roll || '21CS0000';
        document.getElementById('certId').value = chosen?.certId || 'CG-2024-000000';
        document.getElementById('marks').value = chosen?.marks || '80%';
        document.getElementById('issuer').value = chosen?.issuer || 'ABC University';
        CG.toast('Mock OCR extracted fields', 'success');
    }
    if (mockBtn) mockBtn.addEventListener('click', mockOcrFill);

    function validateFormat({ name, roll, certId, marks, issuer }) {
        const issues = [];
        if (!/^\w[\w .'-]{1,80}$/.test(name)) issues.push('Name format unexpected');
        if (!/^[0-9]{2}[A-Z]{2}[A-Z0-9]{2,}[0-9]{2,}$/.test(roll)) issues.push('Roll number format mismatch');
        if (!/^CG-[0-9]{4}-[0-9]{6}$/.test(certId)) issues.push('Certificate ID format invalid');
        if (!/^[0-9]{1,3}(\.[0-9])?%$/.test(marks)) issues.push('Marks format invalid');
        if (!/^.{3,}$/.test(issuer)) issues.push('Issuer missing');
        return issues;
    }

    function checksumOk(certId) {
        const digits = certId.replace(/\D/g, '').split('').map(Number);
        const sum = digits.reduce((a, b) => a + b, 0);
        return sum % 7 === 0; // arbitrary heuristic
    }

    function findMatch({ name, roll, certId }) {
        const reg = CG.getRegistry();
        return reg.find(r => r.certId === certId || (r.roll === roll && r.name.toLowerCase() === name.toLowerCase()));
    }

    function renderResults(status, details) {
        const cls = status === 'VALID' ? 'ok' : status === 'WARN' ? 'warn' : 'err';
        const list = details.map(d => `<li>${d}</li>`).join('');
        results.innerHTML = `<div class="badge ${cls}">${status}</div><ul>${list}</ul>`;
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('name').value.trim(),
                roll: document.getElementById('roll').value.trim(),
                certId: document.getElementById('certId').value.trim(),
                marks: document.getElementById('marks').value.trim(),
                issuer: document.getElementById('issuer').value.trim()
            };

            const issues = validateFormat(data);
            const hasChecksum = checksumOk(data.certId);
            const match = findMatch(data);
            const blacklist = CG.getBlacklist();
            const isBlacklisted = blacklist.some(b => (b.entity || '').toLowerCase() === data.issuer.toLowerCase());

            const details = [];
            if (match) {
                details.push('Registry match found');
            } else {
                details.push('No exact registry match');
            }
            if (issues.length) details.push(...issues);
            details.push(hasChecksum ? 'Checksum heuristic passed' : 'Checksum heuristic failed');
            if (isBlacklisted) details.push('Issuer is blacklisted');

            let status = 'VALID';
            if (isBlacklisted || !match || !hasChecksum || issues.length >= 2) status = 'INVALID';
            else if (issues.length || !hasChecksum) status = 'WARN';

            renderResults(status, details);

            if (status !== 'VALID') {
                CG.pushAlert({ type: status, message: `${status} verification for ${data.certId} (${data.name})`, issuer: data.issuer });
            }
            CG.toast(`Verification: ${status}`, status === 'VALID' ? 'success' : status === 'WARN' ? 'warn' : 'error');
        });
    }
})();

