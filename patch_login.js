const fs = require('fs');

let html = fs.readFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', 'utf8');

// 1. Add Login HTML before PAGE: DASHBOARD
const loginHtml = `
  <!-- ======================== PAGE: LOGIN ======================== -->
  <div class="page" id="page-login">
    <div style="max-width:400px;margin:120px auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:40px 30px;box-shadow:var(--shadow)">
      <div style="text-align:center;margin-bottom:30px">
        <div class="logo-text" style="justify-content:center;font-size:28px">
          <div class="logo-dot" style="width:14px;height:14px"></div>
          DashPro <span style="font-weight:400;color:var(--text3);margin-left:6px">CPA Ideal</span>
        </div>
        <p style="color:var(--text2);margin-top:10px;font-size:14px">
          A calculadora definitiva de CPA e Dashboard de métricas para gestores de tráfego.
        </p>
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input type="email" id="login-email" class="form-input" placeholder="ex: sigopaz@gmail.com">
      </div>
      <div class="form-group">
        <label class="form-label">Senha</label>
        <input type="password" id="login-senha" class="form-input" placeholder="••••••••">
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:20px;padding:12px;font-size:15px" onclick="fazerLogin()">
        Entrar na plataforma
      </button>
    </div>
  </div>
`;
html = html.replace('<!-- ======================== PAGE: DASHBOARD ======================== -->', loginHtml + '\n  <!-- ======================== PAGE: DASHBOARD ======================== -->');

// 2. Change Storage S object and add User State
const storageRegex = /const S = \{\s+get: \([^)]*\) => \{.*?\},\s+set: \([^)]*\) => .*?,\s+\};/gs;
const newStorage = `let currentUser = localStorage.getItem('mp_current_user') || null;

const S = {
  get: (k, def) => { 
    if(!currentUser) return def;
    try { return JSON.parse(localStorage.getItem(\`mp_\${currentUser}_\${k}\`)) ?? def; } catch { return def; } 
  },
  set: (k, v) => {
    if(!currentUser) return;
    localStorage.setItem(\`mp_\${currentUser}_\${k}\`, JSON.stringify(v));
  },
};

function migrateOldData(email) {
  const keys = Object.keys(localStorage);
  let migrated = false;
  for(let key of keys) {
    if(key.startsWith('mp_') && !key.startsWith('mp_sigopaz@gmail.com_') && key !== 'mp_current_user') {
      const bareKey = key.replace('mp_', '');
      const data = localStorage.getItem(key);
      localStorage.setItem(\`mp_\${email}_\${bareKey}\`, data);
      localStorage.removeItem(key);
      migrated = true;
    }
  }
  return migrated;
}

function fazerLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const senha = document.getElementById('login-senha').value;
  if (email === 'sigopaz@gmail.com' && senha === '81174258') {
    currentUser = email;
    localStorage.setItem('mp_current_user', email);
    migrateOldData(email);
    
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.mobile-toggle').style.display = 'flex';
    document.querySelector('.main').style.marginLeft = '';
    
    toast('Login realizado com sucesso!', 'ok');
    
    // Inicia os dados
    goPage('dashboard');
    initApp();
  } else {
    toast('E-mail ou senha incorretos!', 'err');
  }
}

function fazerLogout() {
  currentUser = null;
  localStorage.removeItem('mp_current_user');
  location.reload();
}`;
html = html.replace(storageRegex, newStorage);

// 3. Add Logout to sidebar
html = html.replace('<div class="nav-item" onclick="goPage(\'personalizar\', this)">', '<div class="nav-item" style="color:var(--danger)" onclick="fazerLogout()"><i class="ti ti-logout"></i> Sair</div>\n      <div class="nav-item" onclick="goPage(\'personalizar\', this)">');

// 4. Wrap DOMContentLoaded initialization in initApp
const domContentLoadedRegex = /document\.addEventListener\('DOMContentLoaded', \(\) => \{(.*?)\}\);/s;
const match = domContentLoadedRegex.exec(html);
if (match) {
  const initLogic = match[1];
  const newLogic = `
function initApp() {
${initLogic}
}

document.addEventListener('DOMContentLoaded', () => {
  if (!currentUser) {
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.mobile-toggle').style.display = 'none';
    document.querySelector('.main').style.marginLeft = '0';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-login').classList.add('active');
  } else {
    initApp();
  }
});`;
  html = html.replace(match[0], newLogic);
}

fs.writeFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', html);
console.log('Patch aplicado com sucesso.');
