// Peninsula Heat Pumps shared JS
(function(){
  // Nav scroll state + sticky pill reveal once past hero
  var nav = document.getElementById('nav');
  var sticky = document.querySelector('.sticky');
  var hero = document.querySelector('.hero, .phero, .pdhero');
  if(nav || sticky){
    var setState = function(){
      var y = window.scrollY;
      if(nav) nav.classList.toggle('scrolled', y > 50);
      if(sticky){
        // Show once we've scrolled past most of the hero (or 70vh fallback)
        var threshold = hero ? hero.offsetTop + hero.offsetHeight - 120 : window.innerHeight * 0.7;
        sticky.classList.toggle('show', y > threshold);
      }
    };
    setState();
    window.addEventListener('scroll', setState, { passive:true });
    window.addEventListener('resize', setState, { passive:true });
  }
  // Mobile drawer
  var tog = document.querySelector('.mob-tog');
  var drawer = document.querySelector('.mdrawer');
  if(tog && drawer){
    var closeDrawer = function(){
      tog.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    };
    var openDrawer = function(){
      tog.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    tog.addEventListener('click', function(){
      if(drawer.classList.contains('open')) closeDrawer(); else openDrawer();
    });
    var closeBtn = drawer.querySelector('.mdrawer-close');
    if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function(ev){
      if(ev.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
    drawer.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        tog.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow='';
      });
    });
    // Collapsible groups inside the drawer
    drawer.querySelectorAll('.mdd-tog').forEach(function(btn){
      btn.addEventListener('click', function(){
        var group = btn.closest('.mdd');
        var wasOpen = group.classList.contains('open');
        // Close all groups, then open this one if it wasn't already
        drawer.querySelectorAll('.mdd').forEach(function(g){ g.classList.remove('open'); });
        if(!wasOpen) group.classList.add('open');
      });
    });
  }
  // Fade-in
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('vis'); io.unobserve(x.target); }});
    }, { threshold:0.1, rootMargin:'0px 0px -30px 0px' });
    document.querySelectorAll('.fade').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.fade').forEach(function(el){ el.classList.add('vis'); });
  }
  // Smooth-scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(ev){
      var hash = a.getAttribute('href');
      if(hash.length<=1) return;
      var t = document.querySelector(hash);
      if(t){ ev.preventDefault(); t.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  });
  // Quote form (multi-step) — supports multiple forms per page
  document.querySelectorAll('.qform').forEach(function(qform){
    var cs=1, fd={};
    var slides = qform.querySelectorAll('.fslide');
    var steps = qform.querySelectorAll('.fstep');
    if(!slides.length) return;
    var maxStep = slides.length - 1; // last is success
    var upd = function(){
      slides.forEach(function(s){ s.classList.remove('active'); });
      var slide = qform.querySelector('.fslide[data-s="'+cs+'"]');
      if(slide) slide.classList.add('active');
      steps.forEach(function(s,i){
        s.classList.remove('active','done');
        if(i+1===cs) s.classList.add('active');
        if(i+1<cs) s.classList.add('done');
      });
    };
    qform.querySelectorAll('.ob').forEach(function(b){
      b.addEventListener('click', function(){
        var grp = b.closest('.og');
        grp.querySelectorAll('.ob').forEach(function(x){ x.classList.remove('sel'); });
        b.classList.add('sel');
        var slide = b.closest('.fslide');
        var key = slide.dataset.field || ('Question ' + slide.dataset.s);
        fd[key] = b.dataset.v;
        // Dynamic context: if this form is configured to derive context from
        // a specific field (e.g. "Service" on the services page), update it.
        var ctxFrom = qform.dataset.contextFrom;
        if(ctxFrom && key === ctxFrom){
          qform.dataset.context = b.dataset.v;
        }
        // Auto-advance after a short delay so the user sees their selection
        setTimeout(function(){
          if(cs < maxStep){ cs++; upd(); }
        }, 350);
      });
    });
    var showSuccess = function(){
      cs = maxStep + 1;
      slides.forEach(function(s){ s.classList.remove('active'); });
      var done = qform.querySelector('.fslide[data-s="'+cs+'"]');
      if(done) done.classList.add('active');
      steps.forEach(function(s){ s.classList.remove('active'); s.classList.add('done'); });
    };
    var showError = function(msg){
      var errSlot = qform.querySelector('.qform-error');
      if(!errSlot){
        errSlot = document.createElement('div');
        errSlot.className = 'qform-error';
        errSlot.style.cssText = 'margin-top:12px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-left:3px solid #dc2626;color:#991b1b;font-size:.85rem;border-radius:8px;line-height:1.5';
        var contactSlide = qform.querySelector('.fslide[data-s="'+maxStep+'"]');
        if(contactSlide) contactSlide.appendChild(errSlot);
      }
      errSlot.innerHTML = msg;
    };
    var submitBtn = function(){ return qform.querySelector('.fn[data-action="submit"]'); };
    var sendQuote = function(cb){
      var inputs = qform.querySelectorAll('.fslide[data-s="'+cs+'"] .finp');
      var required = qform.querySelectorAll('.fslide[data-s="'+cs+'"] .finp:not([data-optional])');
      var missing = [];
      required.forEach(function(i){ if(!i.value.trim()) missing.push(i.placeholder || i.name); });
      if(missing.length){ alert('Please fill: ' + missing.join(', ')); cb(false); return; }
      inputs.forEach(function(i){
        if(i.value.trim()) fd[i.placeholder || i.name || i.id] = i.value.trim();
      });

      var ctx = qform.dataset.context || 'Quote Request';
      var to = qform.dataset.to || 'rankify.aus@gmail.com';
      var subject = 'Website enquiry — ' + ctx;

      // Try to find user's email so the client can hit "Reply"
      var userEmail = '';
      Object.keys(fd).forEach(function(k){ if(/email/i.test(k) && !userEmail) userEmail = fd[k]; });

      // Honeypot — if filled, treat as spam (server will silently drop)
      var hp = qform.querySelector('input[name="_honey"]');
      if(hp && hp.value){ cb(true); return; } // pretend success for bots

      // First-name for personalisation
      var userName = '';
      Object.keys(fd).forEach(function(k){ if(/name/i.test(k) && !userName) userName = fd[k]; });
      var firstName = (userName.split(' ')[0] || 'there');

      var autoResponse =
        'Hi ' + firstName + ',\n\n' +
        'Thanks for your enquiry about ' + ctx + ' — we\'ve received it and will be in touch with your personalised quote and full rebate breakdown.\n\n' +
        'Need urgent help in the meantime? Call us on 0417 316 264 (Mon–Fri 8am–5pm).\n\n' +
        'Cheers,\n' +
        'The Peninsula Heat Pumps Team\n' +
        '0417 316 264 | sales@peninsulaheatpumps.com.au\n' +
        'Unit 4/14 Henry Wilson Dr, Capel Sound VIC 3939';

      var payload = {
        _subject: subject,
        _captcha: 'false',
        _template: 'table',
        _replyto: userEmail || '',
        // formsubmit uses the field literally called "email" (lowercase) as the
        // address for the autoresponse and reply-to header.
        email: userEmail || '',
        _autoresponse: autoResponse,
        Service: ctx,
        Page: window.location.href
      };
      Object.keys(fd).forEach(function(k){ payload[k] = fd[k]; });

      var btn = submitBtn();
      var origText = btn ? btn.textContent : '';
      if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; btn.style.opacity = '.7'; }

      var endpoint = 'https://formsubmit.co/ajax/' + encodeURIComponent(to);

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok:r.ok, j:j }; }); })
      .then(function(res){
        if(btn){ btn.disabled = false; btn.textContent = origText; btn.style.opacity = ''; }
        if(res.ok && res.j && (res.j.success === true || res.j.success === 'true' || /success/i.test(res.j.message||''))){
          cb(true);
        } else {
          showError('Sorry, we couldn\'t send that automatically. Please call <a href="tel:0417316264" style="color:#dc2626;font-weight:700">0417 316 264</a> or email <a href="mailto:'+to+'" style="color:#dc2626;font-weight:700">'+to+'</a>.');
          cb(false);
        }
      })
      .catch(function(){
        if(btn){ btn.disabled = false; btn.textContent = origText; btn.style.opacity = ''; }
        showError('Network issue. Please call <a href="tel:0417316264" style="color:#dc2626;font-weight:700">0417 316 264</a> or email <a href="mailto:'+to+'" style="color:#dc2626;font-weight:700">'+to+'</a>.');
        cb(false);
      });
    };
    qform.querySelectorAll('.fn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(btn.dataset.action === 'submit'){
          sendQuote(function(success){ if(success) showSuccess(); });
          return;
        }
        if(cs >= maxStep) return;
        var sel = qform.querySelector('.fslide[data-s="'+cs+'"] .ob.sel');
        if(cs < maxStep && !sel) return;
        cs++; upd();
      });
    });
    qform.querySelectorAll('.fb').forEach(function(b){
      b.addEventListener('click', function(){ if(cs<=1) return; cs--; upd(); });
    });
  });
  // ===== COMPARE TOOL =====
  var compareEl = document.getElementById('compareTool');
  if(compareEl){
    var BRANDS = {
      emerald: { name:'Emerald', tier:'Great Value · $$', img:'images/product-emerald.png', href:'emeralds.html', specs:[
        ['Capacity','270L'],
        ['Recovery rate','79–108 L/hr'],
        ['Refrigerant','R290 Natural'],
        ['Configuration','All-in-one'],
        ['Smart control','Built-in WiFi'],
        ['Noise','49–50 dB(A)'],
        ['Compressor','GMCC / Hitachi'],
        ['Warranty','5yr Parts & Labour'],
        ['Made in','Imported'],
        ['Best for','Cost-conscious'],
      ] },
      aquatech: { name:'Aquatech', tier:'Reliable · $$$', img:'images/product-aquatech.png', href:'aquatech.html', specs:[
        ['Capacity','225L / 268L'],
        ['Recovery rate','198–280 min full tank'],
        ['Refrigerant','R290 Natural'],
        ['Configuration','All-in-one (plug-in)'],
        ['Smart control','WiFi · 5 modes'],
        ['Noise','43 dB(A)'],
        ['Compressor','Toshiba'],
        ['Warranty','5 Years'],
        ['Min temp','Down to -7°C'],
        ['Best for','Budget mid-range'],
      ] },
      istore: { name:'iStore', tier:'Best Seller · $$$', img:'images/product-istore.png', href:'istore.html', feat:true, specs:[
        ['Capacity','270L (180L on req)'],
        ['Recovery rate','70–80 L/hr'],
        ['Refrigerant','R290 Natural'],
        ['Configuration','All-in-one'],
        ['Smart control','iStore app · WiFi'],
        ['Noise','~47 dB'],
        ['Energy cut','Up to 2/3 vs gas/elec'],
        ['Warranty','5 Years'],
        ['Made in','Imported'],
        ['Best for','4–6 person homes'],
      ] },
      rheem: { name:'Rheem AmbiPower', tier:'Premium · $$$$', img:'images/product-rheem.jpg', href:'rheem.html', specs:[
        ['Capacity','280L / 315L / 325L'],
        ['Recovery rate','56–87 L/hr'],
        ['Refrigerant','R290 Natural'],
        ['Configuration','All-in-one or Split'],
        ['Smart control','Touchscreen LED'],
        ['Noise','47–48 dB(A)'],
        ['Tank options','Vitreous / Stainless'],
        ['Warranty','10yr Cylinder'],
        ['Made in','Australia'],
        ['Best for','Trusted brand pick'],
      ] },
      reclaim: { name:'Reclaim Energy', tier:'Premium · $$$$', img:'images/product-reclaim.jpg', href:'reclaim.html', specs:[
        ['Capacity','160 / 250 / 315 / 400L'],
        ['Recovery rate','Up to 110 L/hr'],
        ['Refrigerant','CO₂ Natural'],
        ['Configuration','Split System'],
        ['Smart control','V1.1 or V2 WiFi'],
        ['Noise','~37 dB'],
        ['Tank options','Glass or Stainless'],
        ['Warranty','7–10 yr (controller)'],
        ['Made in','Australia'],
        ['Best for','Larger / solar homes'],
      ] },
      evoheat: { name:'Evo Heat', tier:'Hot Water & Pool · $$$', img:'images/product-evoheat.png', href:'evoheat.html', specs:[
        ['Capacity','270L'],
        ['Refrigerant','R290 Natural'],
        ['Configuration','All-in-one'],
        ['Use','Hot water + Pool'],
        ['Smart control','Inverter'],
        ['Warranty','5 Years'],
        ['Made in','Imported'],
        ['Best for','Households + pool owners'],
      ] },
    };
    var DEFAULT = ['emerald','istore','reclaim'];
    var MAX = 3;
    var selected = DEFAULT.slice();
    var chipsEl = compareEl.querySelector('.csel');
    var gridEl = compareEl.querySelector('.cmp-grid');
    var hintEl = compareEl.querySelector('.csel-hint');

    function renderChips(){
      chipsEl.innerHTML = '';
      Object.keys(BRANDS).forEach(function(key){
        var b = BRANDS[key];
        var isOn = selected.indexOf(key) > -1;
        var atMax = selected.length >= MAX && !isOn;
        var btn = document.createElement('button');
        btn.className = 'csel-chip' + (isOn ? ' on' : '') + (atMax ? ' dis' : '');
        btn.type = 'button';
        btn.dataset.key = key;
        btn.innerHTML = '<span class="csel-dot">' + (isOn ? '✓' : '') + '</span>' + b.name;
        btn.addEventListener('click', function(){
          if(this.classList.contains('dis')) return;
          var idx = selected.indexOf(key);
          if(idx > -1){ selected.splice(idx,1); }
          else if(selected.length < MAX){ selected.push(key); }
          render();
        });
        chipsEl.appendChild(btn);
      });
      hintEl.textContent = 'Pick up to ' + MAX + ' to compare · ' + selected.length + ' selected';
    }
    function renderGrid(){
      gridEl.className = 'cmp-grid cnt-' + selected.length;
      if(selected.length === 0){
        gridEl.innerHTML = '<div class="cmp-empty">👆 Select 2 or 3 brands above to compare them side-by-side.</div>';
        return;
      }
      // Order: keep BRANDS order so columns are consistent
      var ordered = Object.keys(BRANDS).filter(function(k){ return selected.indexOf(k) > -1; });
      gridEl.innerHTML = ordered.map(function(key){
        var b = BRANDS[key];
        var rows = b.specs.map(function(s){
          return '<div class="cmp-row"><span class="k">' + s[0] + '</span><span class="v">' + s[1] + '</span></div>';
        }).join('');
        return '<div class="cmp-card' + (b.feat ? ' feat' : '') + '">' +
          '<div class="cmp-card-img"><img src="' + b.img + '" alt="' + b.name + '"></div>' +
          '<div class="tier">' + b.tier + '</div>' +
          '<h4>' + b.name + '</h4>' +
          '<div class="cmp-rows">' + rows + '</div>' +
          '<a href="' + b.href + '" class="cmp-cta">View ' + b.name + ' →</a>' +
        '</div>';
      }).join('');
    }
    function render(){ renderChips(); renderGrid(); }
    render();
  }
})();
