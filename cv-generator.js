/* ============================================================
   CV Generator — injected into the portfolio bundle.
   Adds a format picker (PDF / Print / Word) to every
   "Download CV" link (a[data-cv]). Source of truth for the
   generated CV lives in the CV object below.
   - PDF  : real .pdf via jsPDF (loaded from CDN; falls back to Print if offline)
   - Print: opens a styled CV and triggers the browser print dialog (offline)
   - Word : downloads a Word-readable .doc (offline, no dependency)
   ============================================================ */
(function () {
  "use strict";

  var CV = {
    name: "Gean Kyle U. Leonor",
    title: "Senior .NET Engineer",
    location: "Tanauan, Leyte, Philippines",
    email: "gean.kyle.u.leonor@outlook.com",
    phone: "+63 932 723 8031",
    website: "https://johnkyle2002.github.io/portfolio/",
    summary:
      "Senior .NET engineer with 13 years of end-to-end ownership across the full SDLC — " +
      "designing, building, and rescuing enterprise applications on a single, deeply-known stack. " +
      "Architecture-first: Clean, CQRS, Onion and IoC applied where they make systems scale and stay " +
      "maintainable. Performance- and cost-obsessed, calm under pressure, and effective across PH / AU / US timezones.",
    skills: [
      ["Languages", "C# (primary), VB.NET, SQL / T-SQL / PL-SQL, JavaScript / jQuery / KnockoutJS, VBA"],
      ["Frameworks", "ASP.NET Core / MVC / API, Blazor, MAUI Blazor Hybrid, WCF, SignalR, gRPC, EF / EF Core, FluentValidation"],
      ["Architecture", "Clean Architecture, CQRS, Onion Architecture, Inversion of Control (IoC), BEM"],
      ["Data & Storage", "SQL Server, MySQL, PostgreSQL, Redis, SSIS / ETL pipelines, SSRS, Tableau"],
      ["DevOps", "Docker, Azure DevOps / TFS, Git / SVN, Jira, Quartz Scheduler, Visual Studio 2015–2022"],
      ["Integrations", "Stripe, Zai Payment, SendGrid, ChartJS, Bootstrap, Automation Anywhere, Tableau Server"]
    ],
    experience: [
      { role: "Senior Backend .NET Developer", org: "Flexisource System & Technologies Inc. — Remote", dates: "Aug 2022 – Jul 2025", note: "3 yrs · most recent" },
      { role: "Senior Software .NET Developer", org: "Terraschwartz Inc", dates: "Jan 2019 – Dec 2022", note: "4 yrs" },
      { role: "Software Developer II / III", org: "Convey Health Solutions Inc.", dates: "Jun 2018 – Dec 2018", note: "7 mo" },
      { role: "Senior .NET Developer", org: "24/7 International Inc.", dates: "Jul 2017 – May 2018", note: "11 mo" },
      { role: "Software Application Developer / Support", org: "Accenture Inc.", dates: "Dec 2011 – Jul 2017", note: "5 yrs" }
    ],
    projects: [
      { title: "ETL modernization — Talend to custom .NET console", desc: "Replaced slow, costly Talend workflows with a custom .NET console app; re-engineered queries, streamlined execution logic, and added Quartz scheduling. Result: significantly faster processing and meaningful licensing & operational cost savings.", tags: "C#, .NET Core, MySQL, PostgreSQL, Quartz Scheduler, Redis" },
      { title: "Legacy re-architecture on Onion layers", desc: "Re-architected a tightly-coupled legacy app using Onion Architecture — clear separation of concerns, dependencies pointing inward, modular feature boundaries. Result: improved scalability and reduced development time on every subsequent release.", tags: "Onion Architecture, ASP.NET Core, EF Core, Blazor, SQL Server 2019, Azure DevOps" },
      { title: "AI in the development loop", desc: "Integrated AI-assisted tooling (Claude Code) into the daily workflow for code generation, debugging support, and refactoring at scale. Result: accelerated development cycles and measurably higher code quality.", tags: "Claude Code, code review, refactoring, test scaffolding" }
    ],
    education: { school: "AMA Computer College — Fairview, Regalado", degree: "BS in Computer Science", dates: "2007 – 2011" },
    awards: [
      "Best in Thesis — built an academic management system (cashier module, subject scheduler, automated grading).",
      "1st Place — School Programming Competition (C++)."
    ]
  };

  var FILEBASE = "Gean-Kyle-Leonor-CV-2026";

  /* ---------- helpers ---------- */
  // Map typographic glyphs to ASCII, then drop anything else non-ASCII so the
  // output is safe in every renderer (Word's XML reader, jsPDF core fonts, etc.)
  function clean(s) {
    return String(s)
      .replace(/[–—]/g, "-")     // en / em dash
      .replace(/·/g, "|")             // middle dot
      .replace(/•/g, "-")             // bullet
      .replace(/[‘’]/g, "'")     // curly single quotes
      .replace(/[“”]/g, '"')     // curly double quotes
      .replace(/…/g, "...")           // ellipsis
      .replace(/ /g, " ")             // non-breaking space
      .replace(/[^\x00-\x7F]/g, "");       // strip any remaining non-ASCII
  }

  // Normalize all CV string fields to ASCII once at startup.
  (function normalize(node) {
    if (typeof node === "string") return;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        if (typeof node[i] === "string") node[i] = clean(node[i]);
        else normalize(node[i]);
      }
      return;
    }
    if (node && typeof node === "object") {
      for (var k in node) {
        if (typeof node[k] === "string") node[k] = clean(node[k]);
        else normalize(node[k]);
      }
    }
  })(CV);

  function esc(s) {
    return clean(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  /* ---------- shared CV markup (used by Print and Word) ---------- */
  function buildCvHtml(forWord) {
    var skills = CV.skills.map(function (s) {
      return '<tr><td class="cat">' + esc(s[0]) + '</td><td>' + esc(s[1]) + "</td></tr>";
    }).join("");

    var exp = CV.experience.map(function (e) {
      return '<div class="item"><div class="row"><strong>' + esc(e.role) + "</strong>" +
        '<span class="dates">' + esc(e.dates) + "</span></div>" +
        '<div class="org">' + esc(e.org) + " &nbsp;|&nbsp; " + esc(e.note) + "</div></div>";
    }).join("");

    var proj = CV.projects.map(function (p) {
      return '<div class="item"><strong>' + esc(p.title) + "</strong>" +
        "<div>" + esc(p.desc) + "</div>" +
        '<div class="tags">' + esc(p.tags) + "</div></div>";
    }).join("");

    var awards = CV.awards.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");

    var styleBlock =
      "<style>" +
      "*{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.5;margin:0;padding:48px 56px;max-width:860px}" +
      "h1{font-size:30px;margin:0;letter-spacing:.5px} .title{font-size:15px;color:#7a5c2e;margin:4px 0 2px;font-weight:bold}" +
      ".contact{font-size:12px;color:#444;margin-bottom:18px} .contact span{margin-right:14px}" +
      "h2{font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#7a5c2e;border-bottom:1.5px solid #d9c7a6;padding-bottom:4px;margin:22px 0 10px}" +
      "p{margin:0 0 8px} .item{margin-bottom:12px} .row{display:flex;justify-content:space-between;align-items:baseline}" +
      ".dates{font-size:12px;color:#666;white-space:nowrap;padding-left:12px} .org{font-size:13px;color:#444;font-style:italic}" +
      ".tags{font-size:11px;color:#7a5c2e;margin-top:2px} table{width:100%;border-collapse:collapse;font-size:13px}" +
      "td{padding:3px 0;vertical-align:top} td.cat{width:150px;font-weight:bold;color:#333} ul{margin:4px 0 0 18px;padding:0} li{margin-bottom:4px;font-size:13px}" +
      "</style>";

    return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + esc(CV.name) + " — CV</title>" +
      styleBlock + "</head><body>" +
      "<h1>" + esc(CV.name) + "</h1>" +
      '<div class="title">' + esc(CV.title) + "</div>" +
      '<div class="contact"><span>' + esc(CV.email) + "</span><span>" + esc(CV.phone) +
      "</span><span>" + esc(CV.location) + "</span>" +
      '<span><a href="' + esc(CV.website) + '">' + esc(CV.website.replace(/^https?:\/\//, "")) + "</a></span></div>" +
      "<h2>Professional Profile</h2><p>" + esc(CV.summary) + "</p>" +
      "<h2>Technical Skills</h2><table>" + skills + "</table>" +
      "<h2>Experience</h2>" + exp +
      "<h2>Selected Work</h2>" + proj +
      "<h2>Education</h2><div class='item'><div class='row'><strong>" + esc(CV.education.degree) +
      "</strong><span class='dates'>" + esc(CV.education.dates) + "</span></div><div class='org'>" +
      esc(CV.education.school) + "</div></div>" +
      "<h2>Awards</h2><ul>" + awards + "</ul>" +
      "</body></html>";
  }

  /* ---------- PRINT (offline) ---------- */
  function generatePrint() {
    var w = window.open("", "_blank");
    if (!w) { alert("Pop-up blocked — allow pop-ups to print the CV."); return; }
    w.document.open();
    w.document.write(buildCvHtml(false));
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 350);
  }

  /* ---------- WORD .docx (offline, real OpenXML, no dependency) ---------- */
  function xesc(s) {
    return clean(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // run: a piece of text with formatting. size = half-points (e.g. 22 = 11pt).
  function run(t, o) {
    o = o || {};
    var rpr = "<w:rPr>";
    if (o.bold) rpr += "<w:b/>";
    if (o.italic) rpr += "<w:i/>";
    rpr += '<w:sz w:val="' + (o.size || 21) + '"/>';
    if (o.color) rpr += '<w:color w:val="' + o.color + '"/>';
    rpr += "</w:rPr>";
    return "<w:r>" + rpr + '<w:t xml:space="preserve">' + xesc(t) + "</w:t></w:r>";
  }

  function para(runsXml, o) {
    o = o || {};
    var ppr = "<w:pPr>";
    var sp = "";
    if (o.before) sp += ' w:before="' + o.before + '"';
    sp += ' w:after="' + (o.after != null ? o.after : 120) + '"';
    ppr += "<w:spacing" + sp + "/>";
    if (o.bottomBorder) {
      ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="D9C7A6"/></w:pBdr>';
    }
    ppr += "</w:pPr>";
    return "<w:p>" + ppr + runsXml + "</w:p>";
  }

  // ---- minimal store-only ZIP writer (no compression) ----
  var CRC_TABLE = (function () {
    var t = [], n, k, c;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(files) {
    var enc = new TextEncoder(), chunks = [], central = [], offset = 0;
    function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
    function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.bytes, crc = crc32(data), size = data.length;
      var local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(name.length), u16(0));
      chunks.push(new Uint8Array(local), name, data);
      var cen = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset));
      central.push({ head: new Uint8Array(cen), name: name });
      offset += local.length + name.length + size;
    });
    var cdStart = offset, cdSize = 0;
    central.forEach(function (c) { chunks.push(c.head, c.name); cdSize += c.head.length + c.name.length; });
    chunks.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0),
      u16(files.length), u16(files.length), u32(cdSize), u32(cdStart), u16(0))));
    var total = 0; chunks.forEach(function (c) { total += c.length; });
    var out = new Uint8Array(total), pos = 0;
    chunks.forEach(function (c) { out.set(c, pos); pos += c.length; });
    return out;
  }

  function generateWord() {
    var brown = "7A5C2E", grey = "555555", dim = "6E6E6E", body = "";

    function heading(t) {
      return para(run(t.toUpperCase(), { bold: true, size: 24, color: brown }),
        { before: 220, after: 80, bottomBorder: true });
    }

    body += para(run(CV.name, { bold: true, size: 44 }), { after: 40 });
    body += para(run(CV.title, { bold: true, size: 26, color: brown }), { after: 30 });
    body += para(run(CV.email + "   ·   " + CV.phone + "   ·   " + CV.location +
      "   ·   " + CV.website, { size: 18, color: grey }), { after: 160 });

    body += heading("Professional Profile");
    body += para(run(CV.summary, { size: 21 }), { after: 120 });

    body += heading("Technical Skills");
    CV.skills.forEach(function (s) {
      body += para(run(s[0] + ":  ", { bold: true, size: 21 }) + run(s[1], { size: 21 }), { after: 80 });
    });

    body += heading("Experience");
    CV.experience.forEach(function (e) {
      body += para(run(e.role, { bold: true, size: 22 }), { after: 0 });
      body += para(run(e.dates + "   ·   " + e.note, { italic: true, size: 18, color: dim }), { after: 20 });
      body += para(run(e.org, { size: 20, color: "444444" }), { after: 140 });
    });

    body += heading("Selected Work");
    CV.projects.forEach(function (p) {
      body += para(run(p.title, { bold: true, size: 21 }), { after: 0 });
      body += para(run(p.desc, { size: 20 }), { after: 20 });
      body += para(run(p.tags, { size: 18, color: brown }), { after: 150 });
    });

    body += heading("Education");
    body += para(run(CV.education.degree, { bold: true, size: 21 }), { after: 0 });
    body += para(run(CV.education.school + "   ·   " + CV.education.dates,
      { size: 20, color: "444444" }), { after: 120 });

    body += heading("Awards");
    CV.awards.forEach(function (a) {
      body += para(run("•  " + a, { size: 21 }), { after: 60 });
    });

    var documentXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>' +
      "</w:sectPr></w:body></w:document>";

    var contentTypes =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>";

    var rels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>";

    var enc = new TextEncoder();
    var zipped = zip([
      { name: "[Content_Types].xml", bytes: enc.encode(contentTypes) },
      { name: "_rels/.rels", bytes: enc.encode(rels) },
      { name: "word/document.xml", bytes: enc.encode(documentXml) }
    ]);
    downloadBlob(
      new Blob([zipped], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      FILEBASE + ".docx"
    );
  }

  /* ---------- PDF via jsPDF (CDN; falls back to Print) ---------- */
  function generatePdf() {
    var make = function () {
      var jsPDF = window.jspdf && window.jspdf.jsPDF;
      if (!jsPDF) { throw new Error("jsPDF unavailable"); }
      var doc = new jsPDF({ unit: "pt", format: "a4" });
      var W = doc.internal.pageSize.getWidth();
      var H = doc.internal.pageSize.getHeight();
      var M = 48, x = M, y = M, maxW = W - M * 2;
      var brown = [122, 92, 46];

      function page() { doc.addPage(); y = M; }
      function need(h) { if (y + h > H - M) page(); }
      function text(str, size, opt) {
        opt = opt || {};
        doc.setFont("times", opt.bold ? "bold" : "normal");
        doc.setFontSize(size);
        if (opt.color) doc.setTextColor(opt.color[0], opt.color[1], opt.color[2]);
        else doc.setTextColor(26, 26, 26);
        var lines = doc.splitTextToSize(clean(str), opt.width || maxW);
        for (var i = 0; i < lines.length; i++) {
          need(size + 4);
          doc.text(lines[i], opt.x || x, y);
          y += size + 4;
        }
      }
      function heading(str) {
        y += 10; need(26);
        doc.setFont("times", "bold"); doc.setFontSize(12);
        doc.setTextColor(brown[0], brown[1], brown[2]);
        doc.text(str.toUpperCase(), x, y);
        y += 6;
        doc.setDrawColor(217, 199, 166); doc.setLineWidth(1);
        doc.line(x, y, W - M, y);
        y += 14;
      }

      // header
      doc.setFont("times", "bold"); doc.setFontSize(24); doc.setTextColor(26, 26, 26);
      doc.text(CV.name, x, y); y += 22;
      text(CV.title, 13, { bold: true, color: brown });
      text(CV.email + "   ·   " + CV.phone + "   ·   " + CV.location, 10, { color: [70, 70, 70] });
      text(CV.website, 10, { color: brown });

      heading("Professional Profile");
      text(CV.summary, 11);

      heading("Technical Skills");
      CV.skills.forEach(function (s) {
        var label = s[0] + ":  ";
        doc.setFont("times", "bold"); doc.setFontSize(10.5);
        var labelW = doc.getTextWidth(label);
        need(15);
        doc.setTextColor(40, 40, 40); doc.text(label, x, y);
        var startY = y;
        text(s[1], 10.5, { x: x + labelW, width: maxW - labelW });
        if (y === startY) y += 14;
        y += 1;
      });

      heading("Experience");
      CV.experience.forEach(function (e) {
        need(34);
        doc.setFont("times", "bold"); doc.setFontSize(11); doc.setTextColor(26, 26, 26);
        doc.text(e.role, x, y);
        doc.setFont("times", "normal"); doc.setFontSize(9.5); doc.setTextColor(110, 110, 110);
        doc.text(e.dates, W - M, y, { align: "right" });
        y += 13;
        text(e.org + "   ·   " + e.note, 10, { color: [90, 90, 90] });
        y += 4;
      });

      heading("Selected Work");
      CV.projects.forEach(function (p) {
        text(p.title, 11, { bold: true });
        text(p.desc, 10);
        text(p.tags, 9.5, { color: brown });
        y += 4;
      });

      heading("Education");
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.setTextColor(26, 26, 26);
      need(28); doc.text(CV.education.degree, x, y);
      doc.setFont("times", "normal"); doc.setFontSize(9.5); doc.setTextColor(110, 110, 110);
      doc.text(CV.education.dates, W - M, y, { align: "right" });
      y += 13;
      text(CV.education.school, 10, { color: [90, 90, 90] });

      heading("Awards");
      CV.awards.forEach(function (a) {
        text("•  " + a, 10.5);
      });

      doc.save(FILEBASE + ".pdf");
    };

    if (window.jspdf && window.jspdf.jsPDF) { make(); return; }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
      .then(make)
      .catch(function () {
        alert("Couldn't load the PDF engine (offline?). Opening the print view instead — choose \"Save as PDF\".");
        generatePrint();
      });
  }

  /* ---------- format picker UI ---------- */
  var menuEl = null;
  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") closeMenu(); }

  function openMenu(anchorRect) {
    closeMenu();
    var overlay = document.createElement("div");
    overlay.setAttribute("style",
      "position:fixed;inset:0;z-index:100000;background:rgba(10,8,5,.55);" +
      "display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeMenu(); });

    var card = document.createElement("div");
    card.setAttribute("style",
      "background:#1c1611;border:1px solid #3a2e1f;border-radius:14px;padding:22px;" +
      "width:300px;max-width:90vw;box-shadow:0 24px 60px rgba(0,0,0,.6);" +
      "font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#efe6d6");

    card.innerHTML =
      "<div style='font-size:15px;font-weight:600;margin-bottom:4px'>Download CV</div>" +
      "<div style='font-size:12px;color:#a89a82;margin-bottom:16px'>Choose a format</div>";

    var opts = [
      ["PDF", "Formatted .pdf — best for sending", "pdf"],
      ["Print / Save as PDF", "Open print view (works offline)", "print"],
      ["Word", "Editable .docx document (offline)", "word"]
    ];
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.setAttribute("style",
        "display:block;width:100%;text-align:left;margin-bottom:10px;padding:12px 14px;" +
        "border-radius:10px;border:1px solid #3a2e1f;background:#241c13;color:#efe6d6;" +
        "cursor:pointer;font:inherit;transition:background .15s,border-color .15s");
      b.onmouseover = function () { b.style.background = "#2e2316"; b.style.borderColor = "#7a5c2e"; };
      b.onmouseout = function () { b.style.background = "#241c13"; b.style.borderColor = "#3a2e1f"; };
      b.innerHTML =
        "<div style='font-size:14px;font-weight:600'>" + o[0] + "</div>" +
        "<div style='font-size:11.5px;color:#a89a82;margin-top:2px'>" + o[1] + "</div>";
      b.onclick = function () {
        closeMenu();
        try {
          if (o[2] === "pdf") generatePdf();
          else if (o[2] === "print") generatePrint();
          else generateWord();
        } catch (err) {
          console.error(err);
          alert("Sorry — couldn't generate the CV: " + err.message);
        }
      };
      card.appendChild(b);
    });

    var cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.setAttribute("style",
      "display:block;width:100%;margin-top:4px;padding:9px;border-radius:10px;border:none;" +
      "background:transparent;color:#a89a82;cursor:pointer;font:inherit;font-size:12.5px");
    cancel.onclick = closeMenu;
    card.appendChild(cancel);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    menuEl = overlay;
    document.addEventListener("keydown", onKey);
  }

  /* ---------- intercept the download links ---------- */
  function wire() {
    var links = document.querySelectorAll("a[data-cv]");
    links.forEach(function (a) {
      if (a.__cvWired) return;
      a.__cvWired = true;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openMenu(a.getBoundingClientRect());
      }, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
