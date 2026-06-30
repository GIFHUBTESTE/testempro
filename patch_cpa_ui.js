const fs = require('fs');

let html = fs.readFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', 'utf8');

// 1. Remove os inputs manuais do CPA (Preço, Custo, Margem)
const manualInputsRegex = /<div class="form-group">\s*<label class="form-label">Preço de venda.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s;
// The above regex might be fragile. Let's do exact replace.

// Let's replace the whole block of manual inputs:
html = html.replace(`            <div class="form-group">
              <label class="form-label">Preço de venda (R$)</label>
              <input type="number" class="form-input" id="cpa-preco" placeholder="Ex: 197.00" min="0" step="0.01" oninput="calcCPA()">
            </div>
            <div class="form-group">
              <label class="form-label">Custo do produto (R$)</label>
              <input type="number" class="form-input" id="cpa-custo-produto" placeholder="Infoproduto = 0" min="0" step="0.01" oninput="calcCPA()">
            </div>
            <div class="form-group">
              <label class="form-label">Margem de lucro desejada (%)</label>
              <input type="number" class="form-input" id="cpa-margem" placeholder="Ex: 30" min="1" max="99" step="1" oninput="calcCPA()">
            </div>`, '');

// 2. Remove 'Ou preencha manualmente abaixo.'
html = html.replace('Selecione 1 ou mais produtos para comparar. Ou preencha manualmente abaixo.', 'Selecione 1 ou mais produtos para analisar.');

// 3. Remove "mês" from Custos incluídos no cálculo
html = html.replace('<div class="card-title"><i class="ti ti-receipt"></i> Custos incluídos no cálculo</div>', '<div class="card-title"><i class="ti ti-receipt"></i> Meus custos</div>');

// Remove /mês from JS
html = html.replace(/R\$\$\{c\.valor\.toLocaleString\('pt-BR', \{minimumFractionDigits:2\}\)\}\/mês/g, 'R$$${c.valor.toLocaleString(\'pt-BR\', {minimumFractionDigits:2})}');

// 4. Update the Product Modal to include Margem de Lucro and Taxas
const prodComissaoHtml = `<div class="form-group">
          <label class="form-label">Comissão/Imposto (%)</label>
          <input type="number" class="form-input" id="prod-comissao" placeholder="Ex: 6" min="0" step="0.1">
        </div>`;
const newProdFields = `<div class="form-group">
          <label class="form-label">Comissão/Imposto (%)</label>
          <input type="number" class="form-input" id="prod-comissao" placeholder="Ex: 6" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Margem de Lucro Desejada (%)</label>
          <input type="number" class="form-input" id="prod-margem" placeholder="Ex: 30" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Taxa do Gateway (%)</label>
          <input type="number" class="form-input" id="prod-gateway" placeholder="Ex: 5" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">Frete (R$)</label>
          <input type="number" class="form-input" id="prod-frete" placeholder="Ex: 20" min="0" step="0.01">
        </div>`;
html = html.replace(prodComissaoHtml, newProdFields);

// Update JS for Product Registration
html = html.replace("const comissao = +document.getElementById('prod-comissao').value||0;", `const comissao = +document.getElementById('prod-comissao').value||0;
  const margem = +document.getElementById('prod-margem').value||0;
  const gateway = +document.getElementById('prod-gateway').value||0;
  const frete = +document.getElementById('prod-frete').value||0;`);
html = html.replace("document.getElementById('prod-comissao').value = p.comissao||'';", `document.getElementById('prod-comissao').value = p.comissao||'';
    document.getElementById('prod-margem').value = p.margem||'';
    document.getElementById('prod-gateway').value = p.gateway||'';
    document.getElementById('prod-frete').value = p.frete||'';`);
html = html.replace("['prod-nome','prod-preco','prod-custo','prod-comissao','prod-obs']", "['prod-nome','prod-preco','prod-custo','prod-comissao','prod-margem','prod-gateway','prod-frete','prod-obs']");
html = html.replace("const item = {nome,tipo,preco,custo,comissao,obs};", "const item = {nome,tipo,preco,custo,comissao,margem,gateway,frete,obs};");

// 5. Update Custos Avulsos to have "Dias que durou" and "Vendas no período"
// Instead of modifying Custos modal, we can add inputs inside the modal.
const modalCustoHtml = `<div class="form-group" id="grp-qtd" style="display:none">
          <label class="form-label">Quantidade</label>
          <input type="number" class="form-input" id="custo-qtd" placeholder="1" min="1" value="1">
        </div>`;
const newModalCustoHtml = `<div class="form-group" id="grp-qtd" style="display:none">
          <label class="form-label">Quantidade</label>
          <input type="number" class="form-input" id="custo-qtd" placeholder="1" min="1" value="1">
        </div>
        <div class="form-group" id="grp-dias" style="display:none">
          <label class="form-label">Dias que durou</label>
          <input type="number" class="form-input" id="custo-dias" placeholder="Ex: 4" min="1">
        </div>
        <div class="form-group" id="grp-vendas" style="display:none">
          <label class="form-label">Vendas no período</label>
          <input type="number" class="form-input" id="custo-vendas-periodo" placeholder="Ex: 34" min="1">
        </div>`;
html = html.replace(modalCustoHtml, newModalCustoHtml);

// Add event listener to toggle displays of Dias/Vendas when Avulso is selected
html = html.replace(`document.getElementById('custo-recorrencia').addEventListener('change', (e) => {
  document.getElementById('grp-qtd').style.display = e.target.value==='avulso'?'block':'none';
});`, `document.getElementById('custo-recorrencia').addEventListener('change', (e) => {
  const isAvulso = e.target.value === 'avulso';
  document.getElementById('grp-qtd').style.display = isAvulso ? 'block' : 'none';
  document.getElementById('grp-dias').style.display = isAvulso ? 'block' : 'none';
  document.getElementById('grp-vendas').style.display = isAvulso ? 'block' : 'none';
});`);

html = html.replace("const qtd = +document.getElementById('custo-qtd').value||1;", `const qtd = +document.getElementById('custo-qtd').value||1;
  const dias = +document.getElementById('custo-dias').value||0;
  const vendasPeriodo = +document.getElementById('custo-vendas-periodo').value||0;`);
html = html.replace("const item = {desc,cat,recorrencia,valor,qtd};", "const item = {desc,cat,recorrencia,valor,qtd,dias,vendasPeriodo};");
html = html.replace("document.getElementById('custo-qtd').value = c.qtd||1;", `document.getElementById('custo-qtd').value = c.qtd||1;
    document.getElementById('custo-dias').value = c.dias||'';
    document.getElementById('custo-vendas-periodo').value = c.vendasPeriodo||'';`);
html = html.replace("['custo-desc','custo-valor','custo-qtd'].forEach", "['custo-desc','custo-valor','custo-qtd','custo-dias','custo-vendas-periodo'].forEach");

fs.writeFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', html);
console.log('Patch UI executado.');
