const fs = require('fs');

let html = fs.readFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', 'utf8');

// The CPA mathematical rewrite
const mathLogic = `
// ============================================================
// LÓGICA FINANCEIRA AVANÇADA (MEDIA BUYING)
// ============================================================
const BIDCAP_CONFIG = {
  fb_multiplier: 1.0,
  tk_multiplier: 0.8,
  perc_conservador: 0.85,
  perc_moderado: 0.925,
  perc_agressivo: 1.0
};

function calcularCustoOperacional(custosSelecionados, metaVendas) {
  let custoRateado = 0;
  let custoFixoTotalMensal = 0;
  
  for(let c of custosSelecionados) {
    if (c.recorrencia === 'avulso' && c.vendasPeriodo && c.vendasPeriodo > 0) {
      // Rateio exato baseado nas vendas realizadas no período do ativo (Ex: BC, Proxy)
      custoRateado += (c.valor * c.qtd) / c.vendasPeriodo;
    } else if (c.recorrencia === 'avulso') {
      custoFixoTotalMensal += (c.valor * c.qtd);
    } else {
      custoFixoTotalMensal += c.valor;
    }
  }
  
  // O restante dos custos mensais é rateado pela meta de vendas
  custoRateado += (custoFixoTotalMensal / (metaVendas || 100));
  
  return custoRateado;
}

function calcularCustosPorVenda(prod, custoOperacional) {
  const preco = prod.preco || 0;
  const custoProd = prod.custo || 0;
  const frete = prod.frete || 0;
  
  const taxaPlataforma = preco * ((prod.comissao || 0) / 100);
  const taxaGateway = preco * ((prod.gateway || 0) / 100);
  
  const custoTotalVenda = custoProd + frete + taxaPlataforma + taxaGateway + custoOperacional;
  return custoTotalVenda;
}

function calcularCenariosCPA(preco, custoTotalVenda, margemDesejadaPerc) {
  const lucroBruto = preco - custoTotalVenda;
  const lucroDesejadoReal = preco * ((margemDesejadaPerc || 0) / 100);
  
  const breakEvenCpa = Math.max(0, lucroBruto);
  const cpaMaximo = Math.max(0, lucroBruto - lucroDesejadoReal);
  
  const conservador = cpaMaximo * BIDCAP_CONFIG.perc_conservador;
  const moderado = cpaMaximo * BIDCAP_CONFIG.perc_moderado;
  const agressivo = cpaMaximo * BIDCAP_CONFIG.perc_agressivo;
  
  return {
    lucroBruto,
    breakEvenCpa,
    cpaMaximo,
    conservador,
    moderado,
    agressivo,
    lucroLiquido: lucroBruto - moderado // Lucro liquido caso acerte o CPA moderado
  };
}

function calcularBidsPlataforma(cpaMax) {
  return {
    fb: cpaMax * BIDCAP_CONFIG.fb_multiplier,
    tk: cpaMax * BIDCAP_CONFIG.tk_multiplier
  };
}
`;

// Inject mathematical functions
html = html.replace('// ============================================================', mathLogic + '\n// ============================================================');

// Rewrite calcCPA
const calcCpaRegex = /function calcCPA\(\) \{[\s\S]*?S\.set\('cpa_results', allResults\);\n\}/s;

const newCalcCpa = `function calcCPA() {
  const metaVendas = +document.getElementById('cf-meta-vendas').value || 100;
  const metaLucro = +document.getElementById('meta-lucro').value || 0;

  const custos = S.get('custos', []);
  const sel = S.get('cpa_custos_sel', custos.map((_, i) => i));
  const custosSelecionados = custos.filter((_, i) => sel.includes(i));
  
  const custoOperacional = calcularCustoOperacional(custosSelecionados, metaVendas);

  const container = document.getElementById('cpa-resultados-container');
  if (!container) return;

  if (productsToCalc.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;padding:40px 20px"><i class="ti ti-calculator" style="font-size:40px;color:var(--text3);display:block;margin-bottom:10px"></i><p style="color:var(--text3);font-size:13px">Selecione produtos para analisar.</p></div>';
    return;
  }

  const showHeader = productsToCalc.length > 1;
  const allResults = [];

  container.innerHTML = '<div class="cpa-results-grid">' + productsToCalc.map(prod => {
    const preco = prod.preco || 0;
    if (preco === 0) return '';
    
    const custoTotalVenda = calcularCustosPorVenda(prod, custoOperacional);
    const cenarios = calcularCenariosCPA(preco, custoTotalVenda, prod.margem || 0);

    allResults.push({ ...prod, ...cenarios, custoTotalVenda, custoOperacional });

    const lucroDisplay = cenarios.lucroLiquido;
    const lucroCor = lucroDisplay >= 0 ? 'var(--text)' : 'var(--danger)';

    return \`<div class="cpa-result-block">
      \${showHeader ? \`<div class="cpa-result-header"><i class="ti ti-package" style="margin-right:6px"></i> \${prod.nome} <span style="float:right;font-weight:700">\${brl(preco)}</span></div>\` : ''}
      <div class="card">
        <div class="card-title"><i class="ti ti-target"></i> CPA máximo por cenário</div>
        <div class="grid3" style="margin-bottom:0">
          <div class="cpa-scenario cpa-scenario-ok">
            <div class="cpa-scenario-title">CONSERVADOR</div>
            <div class="cpa-scenario-val">\${brl(cenarios.conservador)}</div>
            <div class="cpa-scenario-desc">Margem cheia</div>
          </div>
          <div class="cpa-scenario cpa-scenario-warn" style="border:1px solid #1877f2;background:rgba(24,119,242,0.05)">
            <div class="cpa-scenario-title" style="color:#1877f2;font-weight:700">MODERADO ★</div>
            <div class="cpa-scenario-val" style="color:#1877f2">\${brl(cenarios.moderado)}</div>
            <div class="cpa-scenario-desc">Recomendado</div>
          </div>
          <div class="cpa-scenario cpa-scenario-bad">
            <div class="cpa-scenario-title">AGRESSIVO</div>
            <div class="cpa-scenario-val">\${brl(cenarios.agressivo)}</div>
            <div class="cpa-scenario-desc">Máximo volume</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><i class="ti ti-list-details"></i> Breakdown por venda</div>
        <div class="calc-row"><span>Preço de venda</span><span style="font-weight:700">\${brl(preco)}</span></div>
        <div class="calc-row"><span style="color:var(--text3)">(-) Custos e Taxas (Produto/Gateway/Frete)</span><span style="color:var(--danger)">\${brl(custoTotalVenda - custoOperacional)}</span></div>
        <div class="calc-row"><span style="color:var(--text3)">(-) Custo operacional/venda</span><span style="color:var(--danger)">\${brl(custoOperacional)}</span></div>
        <div class="calc-row"><span style="color:var(--text3)">(-) CPA moderado</span><span style="color:var(--danger)">\${brl(cenarios.moderado)}</span></div>
        <div class="calc-row highlight">
          <span>= Lucro por venda (Média)</span>
          <span style="color:\${lucroCor};font-weight:800">\${brl(lucroDisplay)}</span>
        </div>
      </div>
      
    </div>\`;
  }).join('') + '</div>';

  S.set('cpa_results', allResults);
}`;

if (html.match(calcCpaRegex)) {
  html = html.replace(calcCpaRegex, newCalcCpa);
}

// Rewrite renderBidCap
const renderBidCapRegex = /function renderBidCap\(\) \{[\s\S]*?\}\.join\(''\);\n\}/s;

const newRenderBidCap = `function renderBidCap() {
  const produtos = S.get('produtos', []);
  const grid = document.getElementById('bidcap-grid');
  if (!grid) return;
  
  if (!produtos.length) {
    grid.innerHTML = '<div class="card" style="text-align:center;padding:40px 20px;grid-column:1/-1"><i class="ti ti-ad-off" style="font-size:40px;color:var(--text3);display:block;margin-bottom:10px"></i><p style="color:var(--text3);font-size:13px">Nenhum produto cadastrado para calcular recomendações.</p></div>';
    return;
  }
  
  const config = S.get('cpa_config', {});
  const metaVendas = config.metaVendas || 100;
  const custos = S.get('custos', []);
  const sel = S.get('cpa_custos_sel', custos.map((_, i) => i));
  const custosSelecionados = custos.filter((_, i) => sel.includes(i));
  const custoOperacional = calcularCustoOperacional(custosSelecionados, metaVendas);

  grid.innerHTML = produtos.map(prod => {
    if ((prod.preco || 0) === 0) return '';

    const custoTotalVenda = calcularCustosPorVenda(prod, custoOperacional);
    const cenarios = calcularCenariosCPA(prod.preco, custoTotalVenda, prod.margem || 0);

    const fbBids = calcularBidsPlataforma(cenarios.moderado);
    const tkBids = calcularBidsPlataforma(cenarios.moderado); // Wait, TK bid uses CPA
    // Actually, BidCap is based on scenario.
    const fbMin = calcularBidsPlataforma(cenarios.conservador).fb;
    const fbMax = calcularBidsPlataforma(cenarios.agressivo).fb;
    const fbRecomendado = fbBids.fb;

    const tkMin = calcularBidsPlataforma(cenarios.conservador).tk;
    const tkMax = calcularBidsPlataforma(cenarios.agressivo).tk;
    const tkRecomendado = fbBids.tk;

    let warningHTML = '';
    if (cenarios.moderado <= 0) {
      warningHTML = \`<div style="font-size:11px;color:var(--danger);margin-top:6px;background:rgba(208,59,59,0.1);padding:6px;border-radius:4px;display:flex;align-items:center;gap:4px;"><i class="ti ti-alert-triangle"></i> Custos superam o preço! CPA Zerado.</div>\`;
    }

    return \`<div class="bidcap-card">
      <div class="card-title" style="margin-bottom:12px"><i class="ti ti-package"></i> \${prod.nome}</div>
      <div style="text-align:center; font-size:15px; font-weight:700; color:var(--text); margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border);">
        Valor do produto: <span style="color:var(--success)">\${brl(prod.preco)}</span>
      </div>
      
      <div style="font-size:12px;color:var(--text2);margin-bottom:16px;background:var(--bg);padding:10px;border-radius:6px;border:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Lucro Bruto:</span> <strong style="color:var(--success)">\${brl(cenarios.lucroBruto)}</strong></div>
        <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--border);padding-top:4px;margin-top:4px;">
          <span>Custo Operacional Rateado:</span> <strong style="color:var(--danger)">-\${brl(custoOperacional)}</strong>
        </div>
        \${warningHTML}
      </div>

      <div class="bidcap-platform">
        <div class="bidcap-platform-icon" style="background:rgba(24,119,242,0.1);color:#1877f2"><i class="ti ti-brand-facebook"></i></div>
        <div>
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Facebook Ads</div>
          <div class="bidcap-value" style="color:#1877f2">\${brl(fbRecomendado)}</div>
          <div class="bidcap-range">Recomendado: \${brl(fbMin)} a \${brl(fbMax)}</div>
        </div>
      </div>
      <div class="bidcap-platform">
        <div class="bidcap-platform-icon" style="background:rgba(0,0,0,0.1);color:var(--text)"><i class="ti ti-brand-tiktok"></i></div>
        <div>
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-weight:600">TikTok Ads</div>
          <div class="bidcap-value" style="color:var(--text)">\${brl(tkRecomendado)}</div>
          <div class="bidcap-range">Recomendado: \${brl(tkMin)} a \${brl(tkMax)}</div>
        </div>
      </div>
      <div class="bidcap-tip">
        <i class="ti ti-bulb" style="color:var(--warning)"></i>
        Comece com BidCap moderado. Se não gastar, aumente 10% a cada 24h até o limite agressivo.
      </div>
    </div>\`;
  }).join('');
}`;

if (html.match(renderBidCapRegex)) {
  html = html.replace(renderBidCapRegex, newRenderBidCap);
}

fs.writeFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', html);
console.log('Patch de Matemática aplicado.');
