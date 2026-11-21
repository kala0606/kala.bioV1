/* Computationally Yours · handbook menu
   One tiered menu for every page: handbook pages at the top level,
   each page's sections beneath it. To add a page, add one entry to PAGES. */

(function () {
  var PAGES = [
  {
    "href": "./",
    "n": "—",
    "t": "Cover",
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
    "t": "Start here",
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
        "read",
        "08 · Watch"
      ],
      [
        "week-1",
        "09 · Week 1"
      ],
      [
        "week-2",
        "10 · Week 2"
      ],
      [
        "week-3",
        "11 · Week 3"
      ],
      [
        "week-4",
        "12 · Week 4"
      ]
    ]
  },
  {
    "href": "schedule.html",
    "n": "02",
    "t": "Schedule",
    "s": [
      [
        "glance",
        "01 · At a glance"
      ],
      [
        "day",
        "02 · How a day goes"
      ],
      [
        "week-1",
        "03 · Week 1"
      ],
      [
        "week-2",
        "04 · Week 2"
      ],
      [
        "week-3",
        "05 · Week 3"
      ],
      [
        "week-4",
        "06 · Week 4"
      ]
    ]
  },
  {
    "href": "selfstudy.html",
    "n": "02·1",
    "t": "Self-study days",
    "s": [
      [
        "groups",
        "01 · Your group"
      ],
      [
        "day-4",
        "02 · Thursday"
      ],
      [
        "day-5",
        "03 · Friday"
      ],
      [
        "stuck",
        "04 · If you're stuck"
      ],
      [
        "monday",
        "05 · Monday"
      ]
    ]
  },
  {
    "href": "identity.html",
    "n": "03",
    "t": "Identity worksheet",
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
    "n": "04",
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
    "n": "05",
    "t": "System worksheet",
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
    "href": "repo.html",
    "n": "06",
    "t": "Your repo and press",
    "s": [
      [
        "github",
        "01 · GitHub, by asking"
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
        "structure",
        "05 · The structure"
      ],
      [
        "readme",
        "06 · README"
      ],
      [
        "agents",
        "07 · AGENTS.md"
      ],
      [
        "git",
        "08 · Saving habits"
      ],
      [
        "press",
        "09 · What it is"
      ],
      [
        "parts",
        "10 · The parts"
      ],
      [
        "say",
        "11 · What to say"
      ],
      [
        "dials",
        "12 · Dials"
      ],
      [
        "output",
        "13 · Downloads"
      ],
      [
        "online",
        "14 · Online"
      ],
      [
        "library",
        "15 · Prompt library"
      ],
      [
        "authorship",
        "16 · Authorship log"
      ],
      [
        "trouble",
        "17 · When it goes wrong"
      ],
      [
        "public",
        "18 · Going public"
      ]
    ]
  },
  {
    "href": "techniques.html",
    "n": "07",
    "t": "Techniques and foundations",
    "s": [
      [
        "code",
        "01 · From code to image"
      ],
      [
        "coordinates",
        "02 · Coordinates"
      ],
      [
        "vector",
        "03 · Pixels and vectors"
      ],
      [
        "resolution",
        "04 · Resolution"
      ],
      [
        "colour",
        "05 · Colour"
      ],
      [
        "cpu-gpu",
        "06 · CPU and GPU"
      ],
      [
        "rendering",
        "07 · Rendering"
      ],
      [
        "chance",
        "08 · Chance and seeds"
      ],
      [
        "files",
        "09 · Files you'll meet"
      ],
      [
        "choose",
        "How to choose"
      ],
      [
        "noise",
        "10 · Noise and flow fields"
      ],
      [
        "recursion",
        "11 · Recursion and L-systems"
      ],
      [
        "agents",
        "12 · Agents and simulation"
      ],
      [
        "automata",
        "13 · Cellular automata"
      ],
      [
        "data",
        "14 · Data as material"
      ],
      [
        "geometry",
        "15 · Geometry and tiling"
      ],
      [
        "combining",
        "Combining"
      ]
    ]
  },
  {
    "href": "machines.html",
    "n": "08",
    "t": "Machines",
    "s": [
      [
        "booking",
        "01 · Machines"
      ],
      [
        "plotter-machine",
        "02 · The machine"
      ],
      [
        "plotter-prepare",
        "03 · Preparing the SVG"
      ],
      [
        "plotter-pens",
        "04 · Pens and paper"
      ],
      [
        "plotter-test",
        "05 · The test plot"
      ],
      [
        "plotter-run",
        "06 · Running the final"
      ],
      [
        "plotter-spec",
        "07 · Spec sheet"
      ],
      [
        "plotter-trouble",
        "08 · When it goes wrong"
      ],
      [
        "resin-safety",
        "09 · Safety first"
      ],
      [
        "resin-machine",
        "10 · The machine"
      ],
      [
        "resin-prepare",
        "11 · Preparing the model"
      ],
      [
        "resin-after",
        "12 · Wash, cure, finish"
      ],
      [
        "resin-spec",
        "13 · Spec sheet"
      ],
      [
        "resin-trouble",
        "14 · When it goes wrong"
      ],
      [
        "archival-why",
        "15 · Why a print"
      ],
      [
        "archival-file",
        "16 · The file"
      ],
      [
        "archival-paper",
        "17 · Paper"
      ],
      [
        "archival-proof",
        "18 · Test strips and proofs"
      ],
      [
        "archival-handling",
        "19 · Handling"
      ],
      [
        "archival-spec",
        "20 · Spec sheet"
      ],
      [
        "archival-trouble",
        "21 · When it goes wrong"
      ]
    ]
  },
  {
    "href": "docs.html",
    "n": "09",
    "t": "Keeping a record",
    "s": [
      [
        "overview",
        "What the record holds"
      ],
      [
        "entry",
        "01 · The entry"
      ],
      [
        "where",
        "02 · Where it lives"
      ],
      [
        "handin",
        "03 · Handing it in"
      ],
      [
        "critique",
        "04 · At critique"
      ],
      [
        "examples",
        "05 · Examples"
      ],
      [
        "tests",
        "06 · The test log"
      ],
      [
        "process",
        "07 · process.md"
      ],
      [
        "photos",
        "08 · Photographing the work"
      ],
      [
        "reflection",
        "09 · Authorship reflection"
      ]
    ]
  },
  {
    "href": "assessment.html",
    "n": "10",
    "t": "Assessment and critiques",
    "s": [
      [
        "overview",
        "Three submissions"
      ],
      [
        "requirements",
        "Requirements"
      ],
      [
        "a1",
        "01 · Identity"
      ],
      [
        "a2",
        "02 · System"
      ],
      [
        "a3",
        "03 · Final"
      ],
      [
        "present",
        "How critiques run"
      ],
      [
        "notes",
        "Peer notes"
      ],
      [
        "c1",
        "04 · Critique 1"
      ],
      [
        "c2",
        "05 · Critique 2"
      ],
      [
        "c3",
        "06 · Critique 3"
      ],
      [
        "after",
        "After the critique"
      ],
      [
        "check-a1",
        "07 · Identity"
      ],
      [
        "check-a2",
        "08 · System"
      ],
      [
        "check-a3",
        "09 · Final"
      ],
      [
        "copy",
        "In your repository"
      ],
      [
        "integrity",
        "Integrity"
      ]
    ]
  },
  {
    "href": "exhibition.html",
    "n": "11",
    "t": "Exhibition",
    "s": [
      [
        "show",
        "01 · The show"
      ],
      [
        "zone",
        "02 · The zone"
      ],
      [
        "card",
        "03 · The identity card"
      ],
      [
        "statement",
        "04 · The statement"
      ],
      [
        "qr-make",
        "05 · Make the code"
      ],
      [
        "qr-print",
        "06 · Print it"
      ],
      [
        "qr-test",
        "07 · Test it"
      ],
      [
        "atlas",
        "08 · The Collective Atlas"
      ],
      [
        "proposal",
        "09 · The proposal"
      ],
      [
        "plan",
        "10 · Floor plan"
      ],
      [
        "install",
        "11 · Installation day"
      ],
      [
        "checklist",
        "12 · Your checklist"
      ],
      [
        "sixty",
        "13 · Sixty seconds"
      ],
      [
        "studio",
        "14 · For the studio"
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

    var all = el("a", "hb-all", "All sections →");
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
