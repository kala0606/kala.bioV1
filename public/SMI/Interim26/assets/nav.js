/* Computationally Yours · handbook menu
   One tiered menu for every page: handbook pages at the top level,
   each page's sections beneath it. To add a page, add one entry to PAGES. */

(function () {
  var PAGES = [
    { href: "./", n: "—", t: "Handbook cover", s: [["contents", "Contents"]] },
    { href: "schedule.html", n: "02", t: "Twenty days: the schedule", s: [
      ["glance", "At a glance"], ["day", "The day"], ["machines", "Machines"],
      ["week-1", "Week 1 · Identity"], ["week-2", "Week 2 · Computation"],
      ["week-3", "Week 3 · Materialisation"], ["week-4", "Week 4 · Exhibition"],
      ["critiques", "Critiques"], ["open", "Still open"]] },
    { href: "identity.html", n: "04", t: "Identity development worksheet", s: [
      ["condition", "A · The condition"], ["displacement", "B · The displacement"], ["facts", "C · The facts"],
      ["attention", "D · Attention"], ["rules", "E · Beliefs and rules"], ["distance", "F · The distance"],
      ["interview", "G · Pair interview"], ["codex", "H · Codex as interlocutor"],
      ["tests", "Tests of substance"], ["example", "Worked example"]] },
    { href: "manifesto.html", n: "05", t: "Manifesto worksheet", s: [
      ["claims", "A · Raw material"], ["long", "B · The long draft"], ["cut", "C · Cut to 150"],
      ["aloud", "D · Read aloud"], ["system", "E · Into the system"], ["references", "F · References"],
      ["v2", "G · Version 2"], ["tests", "Before you hand it in"], ["reading", "Reading list"],
      ["example", "Worked example"]] },
    { href: "system.html", n: "06", t: "Generative system worksheet", s: [
      ["what", "What a system is"], ["metaphor", "A · Metaphor to rules"], ["diagram", "B · The diagram"],
      ["technique", "C · Technique"], ["architecture", "D · Architecture"], ["parameters", "E · Parameter table"],
      ["variations", "F · Twenty variations"], ["critic", "G · Codex as critic"], ["pathway", "H · Toward a material"],
      ["tests", "Ready for Critique 2"], ["example", "Worked example"]] },
    { href: "codex.html", n: "07", t: "Codex onboarding and prompt library", s: [
      ["what", "What Codex is here"], ["setup", "Setup"], ["rules", "Ground rules"], ["asking", "How to ask"],
      ["library", "Prompt library"], ["authorship", "Authorship log"], ["trouble", "When it goes wrong"]] },
    { href: "log.html", n: "13", t: "Documentation: the daily log", s: [
      ["entry", "The entry"], ["where", "Where it lives"], ["form", "The 3:25 form"],
      ["critique", "At critique"], ["examples", "Examples"]] }
  ];

  var here = location.pathname.split("/").pop() || "./";
  if (here === "index.html") here = "./";

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build() {
    var slot = document.querySelector(".masthead nav");
    if (!slot) return;

    var btn = el("button", "hb-burger", '<span class="hb-bars" aria-hidden="true"><i></i><i></i><i></i></span><span>Contents</span>');
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "hb-drawer");
    slot.replaceWith(btn);

    var scrim = el("div", "hb-scrim");
    var drawer = el("nav", "hb-drawer");
    drawer.id = "hb-drawer";
    drawer.setAttribute("aria-label", "Handbook contents");
    drawer.setAttribute("aria-hidden", "true");

    var head = el("div", "hb-head");
    head.appendChild(el("span", "hb-kicker", "Computationally Yours · Handbook"));
    var close = el("button", "hb-close", '<span aria-hidden="true">×</span>');
    close.type = "button";
    close.setAttribute("aria-label", "Close contents");
    head.appendChild(close);
    drawer.appendChild(head);

    var strip = el("div", "hb-strip");
    strip.setAttribute("data-mondrian", "");
    strip.dataset.seed = "menu";
    strip.dataset.depth = "4";
    strip.dataset.motion = "still";
    drawer.appendChild(strip);

    var list = el("ol", "hb-pages");
    PAGES.forEach(function (p, i) {
      var cur = p.href === here;
      var li = el("li", cur ? "is-current is-open" : "");
      var row = el("div", "hb-row");
      var a = el("a", "hb-page", '<span class="hb-n">' + p.n + '</span><span class="hb-t">' + p.t + "</span>");
      a.href = p.href;
      if (cur) a.setAttribute("aria-current", "page");
      row.appendChild(a);
      var sub = el("ol", "hb-sections");
      sub.id = "hb-sub-" + i;
      if (p.s && p.s.length) {
        var tog = el("button", "hb-toggle", '<span aria-hidden="true"></span>');
        tog.type = "button";
        tog.setAttribute("aria-expanded", cur ? "true" : "false");
        tog.setAttribute("aria-controls", sub.id);
        tog.setAttribute("aria-label", "Sections of " + p.t);
        tog.addEventListener("click", function () {
          var open = li.classList.toggle("is-open");
          tog.setAttribute("aria-expanded", open ? "true" : "false");
        });
        row.appendChild(tog);
        p.s.forEach(function (s) {
          var sa = el("a", null, s[1]);
          sa.href = (cur ? "" : p.href) + "#" + s[0];
          if (cur) sa.addEventListener("click", function () { hide(false); });
          var sli = el("li"); sli.appendChild(sa); sub.appendChild(sli);
        });
      }
      li.appendChild(row);
      li.appendChild(sub);
      list.appendChild(li);
    });
    drawer.appendChild(list);

    var all = el("a", "hb-all", "All twenty sections →");
    all.href = here === "./" ? "#contents" : "./#contents";
    if (here === "./") all.addEventListener("click", function () { hide(false); });
    drawer.appendChild(all);

    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    function show() {
      document.documentElement.classList.add("hb-open");
      drawer.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      setTimeout(function () { close.focus(); }, 30);
    }
    function hide(refocus) {
      document.documentElement.classList.remove("hb-open");
      drawer.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      if (refocus !== false) btn.focus();
    }
    btn.addEventListener("click", show);
    close.addEventListener("click", hide);
    scrim.addEventListener("click", hide);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.documentElement.classList.contains("hb-open")) hide();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
