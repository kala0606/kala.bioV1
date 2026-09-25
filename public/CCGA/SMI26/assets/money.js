/* Chapter 4 — the money. Live ETH price, a slider to imagine other prices,
   and a table of famous sales re-priced in today's ETH. */
(function () {
  'use strict';

  // Fallback if the price API is unreachable (recorded 25 Sep 2026).
  const FALLBACK = { usd: 2690, inr: 258400, when: '25 Sep 2026 (cached)' };

  // Approximate USD→INR rate at the time of each event.
  const INR = { 2019: 69.5, '2020': 74, '2021-03': 72.5, '2021-06': 73, '2021-08': 74, '2021-10': 75, '2021-11': 74.5, '2022-04': 76, '2022-06': 78, '2023-01': 81.5, '2023-02': 82.5, '2023-06': 82, '2025-01': 86, '2025-08': 87.5 };
  function inrRate(date) { return INR[date.slice(0, 7)] || INR[date.slice(0, 4)] || 80; }

  // The sales. usdThen = what the press reported on the day.
  const SALES = [
    { date: '2019-04-08', what: 'Autoglyphs — creation fee', who: 'Larva Labs · first on-chain generative art', eth: 0.2, usdThen: 35 },
    { date: '2021-03-11', what: 'Beeple, <i>Everydays: The First 5000 Days</i>', who: "Christie's · buyer: Vignesh Sundaresan (MetaKovan)", eth: 42329, usdThen: 69346250 },
    { date: '2021-03-22', what: "Jack Dorsey's first tweet, as an NFT", who: 'Valuables by Cent · buyer: Sina Estavi', eth: 1630.58, usdThen: 2900000 },
    { date: '2021-06-11', what: 'Fidenza — mint price', who: 'Tyler Hobbs · 999 pieces, sold out in minutes', eth: 0.17, usdThen: 400 },
    { date: '2021-08-23', what: 'Fidenza #313', who: 'bought at mint for ~$1,400 two months earlier', eth: 1000, usdThen: 3300000 },
    { date: '2021-08-26', what: 'Ringers #879, "The Goose"', who: 'Dmitri Cherniak · buyer: Three Arrows Capital', eth: 1800, usdThen: 5660000 },
    { date: '2021-08-28', what: 'Chromie Squiggle #7583', who: 'Snowfro · highest Squiggle sale', eth: 945, usdThen: 2890000 },
    { date: '2021-10-08', what: 'Ringers #109', who: 'Dmitri Cherniak · highest Art Blocks sale ever', eth: 2100, usdThen: 6930000 },
    { date: '2022-04-13', what: "Dorsey's tweet NFT — top bid when re-listed at $48M", who: 'seven bids, the highest 0.09 ETH', eth: 0.09, usdThen: 280 },
    { date: '2023-06-15', what: 'Ringers #879, "The Goose" — sold again', who: "Sotheby's Grails (3AC liquidation) · sold in dollars", eth: 3540, usdThen: 6200000, usdSale: true },
  ];

  // Approximate month-end ETH/USD. Last twelve months from CoinGecko (Sep 2026); earlier from public price histories, rounded.
  const HISTORY = [
    ['2020-11', 600], ['2020-12', 740], ['2021-01', 1310], ['2021-02', 1420], ['2021-03', 1920], ['2021-04', 2770], ['2021-05', 2700], ['2021-06', 2270], ['2021-07', 2530], ['2021-08', 3430], ['2021-09', 3000], ['2021-10', 4290], ['2021-11', 4630], ['2021-12', 3680],
    ['2022-01', 2690], ['2022-02', 2920], ['2022-03', 3280], ['2022-04', 2820], ['2022-05', 1940], ['2022-06', 1070], ['2022-07', 1680], ['2022-08', 1550], ['2022-09', 1330], ['2022-10', 1570], ['2022-11', 1290], ['2022-12', 1200],
    ['2023-01', 1590], ['2023-02', 1600], ['2023-03', 1820], ['2023-04', 1870], ['2023-05', 1870], ['2023-06', 1930], ['2023-07', 1860], ['2023-08', 1650], ['2023-09', 1670], ['2023-10', 1800], ['2023-11', 2050], ['2023-12', 2280],
    ['2024-01', 2280], ['2024-02', 3340], ['2024-03', 3650], ['2024-04', 3010], ['2024-05', 3760], ['2024-06', 3440], ['2024-07', 3230], ['2024-08', 2510], ['2024-09', 2600], ['2024-10', 2510], ['2024-11', 3700], ['2024-12', 3330],
    ['2025-01', 3300], ['2025-02', 2240], ['2025-03', 1820], ['2025-04', 1790], ['2025-05', 2530], ['2025-06', 2490], ['2025-07', 3700], ['2025-08', 4390], ['2025-09', 4214], ['2025-10', 3802], ['2025-11', 2990], ['2025-12', 2968],
    ['2026-01', 2703], ['2026-02', 1931], ['2026-03', 2024], ['2026-04', 2254], ['2026-05', 2022], ['2026-06', 1610], ['2026-07', 1918], ['2026-08', 2416], ['2026-09', 2684]
  ];
  const MARKS = [['2021-03', 'Beeple'], ['2021-08', 'Fidenza #313'], ['2021-11', 'ETH ATH $4,878'], ['2022-06', '3AC collapses'], ['2023-06', 'The Goose, again'], ['2025-08', 'ETH ATH $4,953']];

  let live = { ...FALLBACK }, price = { ...FALLBACK }, mode = 'live';

  const $ = s => document.querySelector(s);
  const fmtUSD = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1000 ? '$' + Math.round(n).toLocaleString('en-US') : '$' + (n < 10 ? n.toFixed(2) : Math.round(n));
  const fmtINR = n => n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + ' L' : '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtETH = n => n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n >= 1 ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : n.toString();
  const fmtDate = d => { const [y, m, day] = d.split('-'); return day + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y; };

  function render() {
    $('#p-usd').innerHTML = '$' + Math.round(price.usd).toLocaleString('en-US') + (mode === 'live' ? '' : '<small>what if</small>');
    $('#p-inr').innerHTML = '₹' + Math.round(price.inr).toLocaleString('en-IN');
    $('#p-when').textContent = mode === 'live' ? 'live · ' + live.when : 'imagined · drag the slider';
    $('#slider-out').textContent = '$' + Math.round(price.usd).toLocaleString('en-US');
    $('#mode-live').classList.toggle('on', mode === 'live');
    // per-ETH INR rate follows live ratio
    const inrPerUsd = live.inr / live.usd;
    const tb = $('#sales tbody'); tb.innerHTML = '';
    for (const s of SALES) {
      const usdNow = s.eth * price.usd, inrNow = usdNow * inrPerUsd;
      const inrThen = s.usdThen * inrRate(s.date);
      const tr = document.createElement('tr');
      tr.className = usdNow > s.usdThen ? 'up' : 'down';
      tr.innerHTML =
        '<td><span class="year">' + fmtDate(s.date) + '</span></td>' +
        '<td class="what"><b>' + s.what + '</b><small>' + s.who + '</small></td>' +
        '<td class="n">' + (s.usdSale ? '≈' : '') + fmtETH(s.eth) + ' ETH</td>' +
        '<td class="n then">' + fmtUSD(s.usdThen) + '<br><span class="small">' + fmtINR(inrThen) + '</span></td>' +
        '<td class="n now">' + fmtUSD(usdNow) + '<br><span class="small">' + fmtINR(inrNow) + '</span></td>' +
        '<td class="n now">' + (usdNow / s.usdThen >= 1 ? '×' + (usdNow / s.usdThen).toFixed(2) : '×' + (usdNow / s.usdThen).toFixed(2)) + '</td>';
      tb.appendChild(tr);
    }
    // a few derived sentences
    $('#beeple-now').textContent = fmtUSD(42329 * price.usd);
    $('#goose-eth-now').textContent = fmtETH(Math.round(6200000 / price.usd)) + ' ETH';
    $('#fidenza-mint-now').textContent = fmtUSD(0.17 * price.usd) + ' / ' + fmtINR(0.17 * price.usd * inrPerUsd);
    drawChart();
  }

  function drawChart() {
    const svg = $('#chart svg'); if (!svg) return;
    const W = 900, H = 320, L = 50, R = 20, T = 30, B = 40;
    const xs = HISTORY.map((_, i) => L + i * (W - L - R) / (HISTORY.length - 1));
    const max = 5200;
    const y = v => T + (H - T - B) * (1 - v / max);
    let d = '';
    HISTORY.forEach((h, i) => { d += (i ? 'L' : 'M') + xs[i].toFixed(1) + ',' + y(h[1]).toFixed(1); });
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#15171c';
    const pen = getComputedStyle(document.documentElement).getPropertyValue('--pen').trim() || '#2338c8';
    const rule = '#d9d9d2';
    let out = '';
    for (const v of [1000, 2000, 3000, 4000, 5000]) out += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${rule}" stroke-width="1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" fill="#7a7d86">$${v / 1000}k</text>`;
    HISTORY.forEach((h, i) => { if (h[0].endsWith('-01')) out += `<text x="${xs[i]}" y="${H - 16}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#7a7d86">${h[0].slice(0, 4)}</text>`; });
    out += `<path d="${d}" fill="none" stroke="${pen}" stroke-width="1.8" stroke-linejoin="round"/>`;
    for (const [m, label] of MARKS) {
      const i = HISTORY.findIndex(h => h[0] === m); if (i < 0) continue;
      out += `<circle cx="${xs[i]}" cy="${y(HISTORY[i][1])}" r="3.5" fill="#fff" stroke="${ink}" stroke-width="1.2"/>`;
      out += `<text x="${xs[i]}" y="${y(HISTORY[i][1]) - 10}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="${ink}">${label}</text>`;
    }
    // the imagined / live price as a horizontal line
    const p = Math.min(max, price.usd);
    out += `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#c8321f" stroke-width="1" stroke-dasharray="4 4"/><text x="${W - R}" y="${y(p) - 5}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" fill="#c8321f">${mode === 'live' ? 'now' : 'what if'} $${Math.round(price.usd).toLocaleString('en-US')}</text>`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = out;
  }

  async function fetchLive() {
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr', { cache: 'no-store' });
      const j = await r.json();
      if (j.ethereum && j.ethereum.usd) {
        live = { usd: j.ethereum.usd, inr: j.ethereum.inr, when: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST · CoinGecko' };
        if (mode === 'live') price = { ...live };
        $('#slider').value = Math.round(live.usd);
        render();
      }
    } catch (e) { /* keep fallback */ }
  }

  function boot() {
    const slider = $('#slider');
    slider.value = Math.round(price.usd);
    slider.addEventListener('input', () => { mode = 'what-if'; price = { usd: +slider.value, inr: +slider.value * (live.inr / live.usd) }; render(); });
    $('#mode-live').addEventListener('click', () => { mode = 'live'; price = { ...live }; slider.value = Math.round(live.usd); render(); });
    document.querySelectorAll('[data-price]').forEach(b => b.addEventListener('click', () => { mode = 'what-if'; slider.value = b.dataset.price; price = { usd: +b.dataset.price, inr: +b.dataset.price * (live.inr / live.usd) }; render(); }));
    render();
    fetchLive();
    setInterval(fetchLive, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
