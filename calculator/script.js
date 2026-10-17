// Scientific calculator logic
document.addEventListener('DOMContentLoaded', () => {
  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const angleToggle = document.getElementById('angle-toggle');
  const formatToggle = document.getElementById('format-toggle');
  const buttons = document.querySelectorAll('.buttons .btn');

  let expression = '';
  let lastAnswer = 0;
  let degMode = true;
  let completedExpression = '';
  let resultText = '0';
  let hasEvaluated = false;
  let fractionMode = true;
  let audioContext = null;

  function playClickSound() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;

    audioContext ||= new AudioContextConstructor();
    const playTone = () => {
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(980, now);
      oscillator.frequency.exponentialRampToValueAtTime(560, now + 0.045);
      volume.gain.setValueAtTime(0.018, now);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    };

    if (audioContext.state === 'suspended') {
      audioContext.resume().then(playTone).catch(() => {});
    } else {
      playTone();
    }
  }

  function animateResult() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    resultEl.animate(
      [
        { opacity: 0.55, transform: 'translateY(5px) scale(0.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ],
      { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
  }

  function render() {
    const displayExpression = (expression || completedExpression || '0')
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/-/g, '−');
    exprEl.textContent = displayExpression
      .replace(/([+×÷−])/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
    resultEl.textContent = resultText;
  }

  function safeAppend(value) {
    if (hasEvaluated) {
      if (/^[+\-*/^]$/.test(value)) {
        expression = String(lastAnswer);
      } else {
        expression = '';
      }
      completedExpression = '';
      resultText = '';
      hasEvaluated = false;
    }
    expression += value;
    render();
  }

  function clearAll() {
    expression = '';
    completedExpression = '';
    resultText = '0';
    hasEvaluated = false;
    render();
  }

  function clearEntry() {
    expression = '';
    completedExpression = '';
    resultText = '0';
    hasEvaluated = false;
    render();
  }

  function backspace() {
    if (hasEvaluated) {
      expression = String(lastAnswer);
      completedExpression = '';
      resultText = '';
      hasEvaluated = false;
    }
    if (!expression) return;
    expression = expression.slice(0, -1);
    render();
  }

  function toggleSign() {
    if (hasEvaluated) {
      expression = String(lastAnswer);
      completedExpression = '';
      resultText = '';
      hasEvaluated = false;
    }
    // try to toggle sign of last number
    const match = expression.match(/(-?[0-9]*\.?[0-9]+)$/);
    if (match) {
      const n = match[1];
      const start = expression.slice(0, -n.length);
      expression = start + (n.startsWith('-') ? n.slice(1) : '-' + n);
    } else {
      // if none, prepend a minus
      expression = expression ? '-' + '(' + expression + ')' : '-';
    }
    render();
  }

  function insertAns() {
    safeAppend('ans');
  }

  function percentize() {
    // convert last number into (number/100)
    if (hasEvaluated) {
      expression = String(lastAnswer);
      completedExpression = '';
      resultText = '';
      hasEvaluated = false;
    }
    expression = expression.replace(/([0-9]*\.?[0-9]+)(?!.*[0-9]*\.?[0-9]+)/, '($1/100)');
    render();
  }

  function fractionResult(value, sourceExpression) {
    if (!sourceExpression.includes('/') || !/^(?:[0-9+\-*/^().\s]|ans)*$/.test(sourceExpression)) {
      return null;
    }

    const sign = value < 0 ? '-' : '';
    const absoluteValue = Math.abs(value);
    if (Number.isInteger(absoluteValue) || absoluteValue > 1_000_000_000) return null;

    let remainder = absoluteValue;
    let previousNumerator = 0;
    let numerator = 1;
    let previousDenominator = 1;
    let denominator = 0;

    for (let i = 0; i < 32; i += 1) {
      const wholePart = Math.floor(remainder);
      const nextNumerator = wholePart * numerator + previousNumerator;
      const nextDenominator = wholePart * denominator + previousDenominator;
      if (nextDenominator > 10000) return null;

      if (Math.abs(nextNumerator / nextDenominator - absoluteValue) < 1e-12) {
        return `${sign}${nextNumerator}/${nextDenominator}`;
      }

      previousNumerator = numerator;
      numerator = nextNumerator;
      previousDenominator = denominator;
      denominator = nextDenominator;

      const fractionalPart = remainder - wholePart;
      if (fractionalPart < Number.EPSILON) break;
      remainder = 1 / fractionalPart;
    }

    return null;
  }

  function formatResult(value, sourceExpression) {
    const fraction = fractionMode ? fractionResult(value, sourceExpression) : null;
    if (fraction) return fraction;

    const rounded = Number(value.toPrecision(12));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }

  function evalExpression() {
    if (!expression) return;
    try {
      const sourceExpression = expression;
      let expr = sourceExpression;

      // map visual tokens
      expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/–/g, '-').replace(/—/g, '-');

      // replace unicode pi
      expr = expr.replace(/π/g, 'pi');

      // replace √(foo) or √foo with sqrt(foo)
      expr = expr.replace(/√\(/g, 'sqrt(');
      expr = expr.replace(/√([0-9A-Za-z(])/g, 'sqrt($1');

      // replace '^' with JS exponent operator
      expr = expr.replace(/\^/g, '**');

      // handle factorial: replace occurrences like 5! or (3+2)! with fact(...)
      const factRegex = /(\d+(\.\d+)?|\([^()]*\))!/;
      while (factRegex.test(expr)) {
        expr = expr.replace(factRegex, 'fact($1)');
      }

      // safety: allow only certain characters (digits, letters, operators, parentheses, ., comma, *)
      if (!/^[0-9+\-*/%^().,eπpiansqrtloglnpowfactxyMathA-Za-z_*]+$/.test(expr)) {
        throw new Error('Invalid characters in expression');
      }

      // Build function that provides helper math functions and evaluates the expression.
      const funcBody = `
        const degMode = ${degMode};
        function sin(x){ return degMode ? Math.sin(x*Math.PI/180) : Math.sin(x); }
        function cos(x){ return degMode ? Math.cos(x*Math.PI/180) : Math.cos(x); }
        function tan(x){ return degMode ? Math.tan(x*Math.PI/180) : Math.tan(x); }
        function asin(x){ return degMode ? Math.asin(x)*180/Math.PI : Math.asin(x); }
        function acos(x){ return degMode ? Math.acos(x)*180/Math.PI : Math.acos(x); }
        function atan(x){ return degMode ? Math.atan(x)*180/Math.PI : Math.atan(x); }
        function ln(x){ return Math.log(x); }
        function log(x){ return Math.log10 ? Math.log10(x) : Math.log(x)/Math.log(10); }
        function sqrt(x){ return Math.sqrt(x); }
        function pow(x,y){ return Math.pow(x,y); }
        function fact(n){
          n = Math.floor(Number(n));
          if (!isFinite(n) || n < 0) return NaN;
          let r=1;
          for(let i=2;i<=n;i++) r*=i;
          return r;
        }
        const pi = Math.PI, e = Math.E, ans = ${Number.isFinite(lastAnswer)? lastAnswer : 0};
        return (${expr});
      `;
      const result = Function(funcBody)();
      if (typeof result === 'number' && isFinite(result)) {
        lastAnswer = result;
        resultText = formatResult(result, sourceExpression);
        completedExpression = sourceExpression;
        expression = '';
        hasEvaluated = true;
      } else {
        resultText = 'Error';
        completedExpression = sourceExpression;
        expression = '';
        hasEvaluated = true;
      }
    } catch (err) {
      resultText = 'Error';
      completedExpression = expression;
      expression = '';
      hasEvaluated = true;
      console.error(err);
    }
    render();
    animateResult();
  }

  // handle button clicks
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound();
      const v = btn.getAttribute('data-value');
      const action = btn.getAttribute('data-action');

      if (action === 'clear') { clearAll(); return; }
      if (action === 'clear-entry') { clearEntry(); return; }
      if (action === 'back') { backspace(); return; }
      if (action === 'neg') { toggleSign(); return; }
      if (action === 'ans') { insertAns(); return; }
      if (action === 'eval') { evalExpression(); return; }

      if (v === 'percent') { percentize(); return; }

      // special mapping
      if (v === 'pi') { safeAppend('pi'); return; }
      if (v === 'e') { safeAppend('e'); return; }
      if (v === '√(') { safeAppend('√('); return; }
      if (v === '!') { safeAppend('!'); return; }
      if (v === 'pow(') { // e^x (we map to pow(Math.E,x))
        safeAppend('pow(e,');
        return;
      }

      // default append
      safeAppend(v || '');
    });
  });

  angleToggle.addEventListener('click', () => {
    playClickSound();
    degMode = !degMode;
    angleToggle.textContent = degMode ? 'DEG' : 'RAD';
    angleToggle.classList.toggle('active', !degMode);
  });

  formatToggle.addEventListener('click', () => {
    playClickSound();
    fractionMode = !fractionMode;
    formatToggle.textContent = fractionMode ? 'FRAC' : 'DEC';
    formatToggle.setAttribute('aria-pressed', String(fractionMode));
    formatToggle.setAttribute('aria-label', `Result format: ${fractionMode ? 'fractions' : 'decimals'}`);
    formatToggle.title = `Switch to ${fractionMode ? 'decimal' : 'fraction'} results`;
    if (hasEvaluated && resultText !== 'Error') {
      resultText = formatResult(lastAnswer, completedExpression);
    }
    render();
    animateResult();
  });

  // keyboard support
  document.addEventListener('keydown', (ev) => {
    const k = ev.key;
    if ((k >= '0' && k <= '9') || k === '.') {
      safeAppend(k);
      ev.preventDefault();
      return;
    }
    if (k === 'Enter') { evalExpression(); ev.preventDefault(); return; }
    if (k === 'Backspace') { backspace(); ev.preventDefault(); return; }
    if (k === 'Escape') { clearAll(); ev.preventDefault(); return; }
    const map = {
      '/': '/', '*': '*', '-': '-', '+': '+', '(': '(', ')': ')', '^': '^', '%': 'percent'
    };
    if (k in map) {
      if (map[k] === 'percent') percentize(); else safeAppend(map[k]);
      ev.preventDefault();
    }
  });

  // initial render
  render();
});
