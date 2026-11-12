/* Computationally Yours · handbook menu
   One tiered menu for every page: handbook pages at the top level,
   each page's sections beneath it. To add a page, add one entry to PAGES. */

(function () {
  var PAGES = [
  {
    "href": "./",
    "n": "—",
    "t": "Handbook cover",
    "s": [
      [
        "contents",
        "Contents"
      ]
    ]
  },
  {
    "href": "intro.html",
    "n": "01",
    "t": "Introduction and conceptual framing",
    "s": [
      [
        "premise",
        "01 · The premise"
      ],
      [
        "identity",
        "02 · Authored identities"
      ],
      [
        "systems",
        "03 · Rules as authorship"
      ],
      [
        "ai",
        "04 · Codex and authorship"
      ],
      [
        "material",
        "05 · Material"
      ],
      [
        "atlas",
        "06 · An Atlas of Elsewhere"
      ],
      [
        "care",
        "07 · Speaking with care"
      ],
      [
        "month",
        "08 · What the month asks"
      ]
    ]
  },
  {
    "href": "schedule.html",
    "n": "02",
    "t": "Twenty days: the schedule",
    "s": [
      [
        "glance",
        "01 · At a glance"
      ],
      [
        "day",
        "02 · The day"
      ],
      [
        "machines",
        "03 · Machines"
      ],
      [
        "week-1",
        "04 · Week 1"
      ],
      [
        "week-2",
        "05 · Week 2"
      ],
      [
        "week-3",
        "06 · Week 3"
      ],
      [
        "week-4",
        "07 · Week 4"
      ],
      [
        "critiques",
        "08 · Critiques"
      ],
      [
        "open",
        "09 · Still open"
      ]
    ]
  },
  {
    "href": "briefs.html",
    "n": "03",
    "t": "Weekly assignment briefs",
    "s": [
      [
        "how",
        "How briefs work"
      ],
      [
        "week-1",
        "01 · Week 1"
      ],
      [
        "week-2",
        "02 · Week 2"
      ],
      [
        "week-3",
        "03 · Week 3"
      ],
      [
        "week-4",
        "04 · Week 4"
      ]
    ]
  },
  {
    "href": "identity.html",
    "n": "04",
    "t": "Identity development worksheet",
    "s": [
      [
        "condition",
        "A · The condition"
      ],
      [
        "displacement",
        "B · The displacement"
      ],
      [
        "facts",
        "C · The facts"
      ],
      [
        "attention",
        "D · Attention"
      ],
      [
        "rules",
        "E · Beliefs and rules"
      ],
      [
        "distance",
        "F · The distance"
      ],
      [
        "interview",
        "G · Pair interview"
      ],
      [
        "codex",
        "H · Codex as interlocutor"
      ],
      [
        "tests",
        "Tests of substance"
      ],
      [
        "example",
        "A worked example"
      ]
    ]
  },
  {
    "href": "manifesto.html",
    "n": "05",
    "t": "Manifesto worksheet",
    "s": [
      [
        "claims",
        "A · Raw material"
      ],
      [
        "long",
        "B · The long draft"
      ],
      [
        "cut",
        "C · Cut to 150"
      ],
      [
        "aloud",
        "D · Read aloud"
      ],
      [
        "system",
        "E · Into the system"
      ],
      [
        "references",
        "F · References"
      ],
      [
        "v2",
        "G · Version 2"
      ],
      [
        "tests",
        "Before you hand it in"
      ],
      [
        "reading",
        "Reading list"
      ],
      [
        "example",
        "A worked example"
      ]
    ]
  },
  {
    "href": "system.html",
    "n": "06",
    "t": "Generative system worksheet",
    "s": [
      [
        "what",
        "What a system is"
      ],
      [
        "metaphor",
        "A · Metaphor to rules"
      ],
      [
        "diagram",
        "B · The diagram"
      ],
      [
        "technique",
        "C · Technique"
      ],
      [
        "architecture",
        "D · Architecture"
      ],
      [
        "parameters",
        "E · Parameter table"
      ],
      [
        "variations",
        "F · Twenty variations"
      ],
      [
        "critic",
        "G · Codex as critic"
      ],
      [
        "pathway",
        "H · Toward a material"
      ],
      [
        "tests",
        "Ready for Critique 2"
      ],
      [
        "example",
        "A worked example"
      ]
    ]
  },
  {
    "href": "codex.html",
    "n": "07",
    "t": "Codex onboarding and prompt library",
    "s": [
      [
        "what",
        "01 · What Codex is here"
      ],
      [
        "setup",
        "02 · Setup"
      ],
      [
        "rules",
        "03 · Ground rules"
      ],
      [
        "asking",
        "04 · How to ask"
      ],
      [
        "library",
        "05 · Prompt library"
      ],
      [
        "authorship",
        "06 · Authorship log"
      ],
      [
        "trouble",
        "07 · When it goes wrong"
      ]
    ]
  },
  {
    "href": "techniques.html",
    "n": "08",
    "t": "Computational techniques",
    "s": [
      [
        "choose",
        "How to choose"
      ],
      [
        "noise",
        "01 · Noise and flow fields"
      ],
      [
        "recursion",
        "02 · Recursion and L-systems"
      ],
      [
        "agents",
        "03 · Agents and simulation"
      ],
      [
        "automata",
        "04 · Cellular automata"
      ],
      [
        "data",
        "05 · Data as material"
      ],
      [
        "geometry",
        "06 · Geometry and tiling"
      ],
      [
        "combining",
        "Combining"
      ]
    ]
  },
  {
    "href": "repo.html",
    "n": "09",
    "t": "Repository and AGENTS.md template",
    "s": [
      [
        "structure",
        "01 · The structure"
      ],
      [
        "readme",
        "02 · README"
      ],
      [
        "agents",
        "03 · AGENTS.md"
      ],
      [
        "git",
        "04 · Git habits"
      ],
      [
        "gitignore",
        "05 · .gitignore"
      ],
      [
        "public",
        "06 · Going public"
      ]
    ]
  },
  {
    "href": "plotter.html",
    "n": "10",
    "t": "Pen plotter production guide",
    "s": [
      [
        "machine",
        "01 · The machine"
      ],
      [
        "booking",
        "02 · Booking"
      ],
      [
        "prepare",
        "03 · Preparing the SVG"
      ],
      [
        "pens",
        "04 · Pens and paper"
      ],
      [
        "test",
        "05 · The test plot"
      ],
      [
        "run",
        "06 · Running the final"
      ],
      [
        "spec",
        "07 · Spec sheet"
      ],
      [
        "trouble",
        "08 · When it goes wrong"
      ]
    ]
  },
  {
    "href": "resin.html",
    "n": "11",
    "t": "Resin printing production guide",
    "s": [
      [
        "safety",
        "01 · Safety first"
      ],
      [
        "machine",
        "02 · The machine"
      ],
      [
        "booking",
        "03 · Booking"
      ],
      [
        "prepare",
        "04 · Preparing the model"
      ],
      [
        "after",
        "05 · Wash, cure, finish"
      ],
      [
        "spec",
        "06 · Spec sheet"
      ],
      [
        "trouble",
        "07 · When it goes wrong"
      ]
    ]
  },
  {
    "href": "archival.html",
    "n": "12",
    "t": "Archival printing production guide",
    "s": [
      [
        "why",
        "01 · Why a print"
      ],
      [
        "file",
        "02 · The file"
      ],
      [
        "paper",
        "03 · Paper"
      ],
      [
        "proof",
        "04 · Test strips and proofs"
      ],
      [
        "handling",
        "05 · Handling"
      ],
      [
        "spec",
        "06 · Spec sheet"
      ],
      [
        "trouble",
        "07 · When it goes wrong"
      ]
    ]
  },
  {
    "href": "log.html",
    "n": "13·1",
    "t": "The daily log",
    "s": [
      [
        "entry",
        "02 · The entry"
      ],
      [
        "where",
        "03 · Where it lives"
      ],
      [
        "form",
        "04 · The 3:25 form"
      ],
      [
        "critique",
        "05 · At critique"
      ],
      [
        "examples",
        "06 · Examples"
      ]
    ]
  }
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
