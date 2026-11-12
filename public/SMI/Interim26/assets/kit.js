/* Computationally Yours · shared page kit
   - [data-copy] buttons copy text: data-copy="id" names the element,
     otherwise the nearest <pre> in the same .kit-tpl or card.
   - [data-store="name"] checklists remember their ticks in this browser;
     [data-progress="name"] shows how many are done; [data-reset="name"] clears. */
(function () {
  var page = location.pathname.split("/").pop().replace(".html", "") || "index";

  function copy(text, btn) {
    var orig = btn.textContent;
    function ok() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = orig; }, 1600); }
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) {} document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }
  window.cyCopy = copy;

  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-copy");
      var el = id ? document.getElementById(id) : null;
      if (!el) { var box = b.closest(".kit-tpl, .card, article, div"); el = box && box.querySelector("pre"); }
      if (el) copy(el.innerText || el.textContent, b);
    });
  });

  document.querySelectorAll("[data-store]").forEach(function (box) {
    var name = box.getAttribute("data-store"), key = "cy-" + page + "-" + name;
    var inputs = [].slice.call(box.querySelectorAll("input[type=checkbox]"));
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) {}
    inputs.forEach(function (inp, i) { inp.checked = !!saved[i]; inp.addEventListener("change", update); });
    var prog = document.querySelector('[data-progress="' + name + '"]');
    function update() {
      var s = {}, n = 0;
      inputs.forEach(function (inp, i) { if (inp.checked) { s[i] = 1; n++; } });
      try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {}
      if (prog) {
        prog.querySelector("b").textContent = n + " of " + inputs.length;
        prog.querySelector(".bar i").style.width = (inputs.length ? n / inputs.length * 100 : 0) + "%";
        prog.classList.toggle("done", n === inputs.length && n > 0);
      }
    }
    update();
    var reset = document.querySelector('[data-reset="' + name + '"]');
    if (reset) reset.addEventListener("click", function () {
      if (!confirm("Untick every item in this checklist?")) return;
      inputs.forEach(function (inp) { inp.checked = false; }); update();
    });
  });
})();
