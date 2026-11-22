(() => {
  const lessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasMouse = window.matchMedia("(pointer: fine)").matches;

  const menuBtn = document.querySelector(".menu-btn");
  const menu = document.querySelector(".menu");

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
  }

  const inSections = location.pathname.includes("/sections/") || location.pathname.includes("\\sections\\");
  const logoPath = inSections ? "../img/svg/klarsicht-mark.svg" : "assets/img/svg/klarsicht-mark.svg";
  const pageFade = document.createElement("div");
  pageFade.className = "page-transition";
  pageFade.setAttribute("aria-hidden", "true");
  pageFade.innerHTML = `
    <div class="pt-center">
      <img class="pt-logo" src="${logoPath}" alt="" width="72" height="72" />
      <div class="pt-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="pt-progress__bar"></span>
      </div>
    </div>
  `;
  document.body.appendChild(pageFade);

  const progressBox = pageFade.querySelector(".pt-progress");
  const progressBar = pageFade.querySelector(".pt-progress__bar");

  const setProgress = (value) => {
    if (progressBar) progressBar.style.width = `${value}%`;
    if (progressBox) progressBox.setAttribute("aria-valuenow", String(Math.round(value)));
  };

  const fadeOut = () =>
    new Promise((done) => {
      if (lessMotion) {
        done();
        return;
      }

      setProgress(0);
      pageFade.className = "page-transition is-visible is-loading";
      void pageFade.offsetWidth;

      const started = performance.now();
      const length = 780;

      const step = (now) => {
        const t = Math.min(1, (now - started) / length);
        const ease = 1 - Math.pow(1 - t, 3);
        setProgress(ease * 100);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          pageFade.classList.add("is-ready");
          window.setTimeout(done, 80);
        }
      };

      requestAnimationFrame(step);
    });

  const fadeIn = () => {
    const cameFromLink = sessionStorage.getItem("ks-doors") === "1";
    if (!cameFromLink && !document.documentElement.classList.contains("ks-cover")) return;
    sessionStorage.removeItem("ks-doors");

    if (lessMotion) {
      document.documentElement.classList.remove("ks-cover");
      return;
    }

    setProgress(100);
    pageFade.className = "page-transition is-visible is-arrive is-ready";
    document.documentElement.classList.remove("ks-cover");
    void pageFade.offsetWidth;

    window.setTimeout(() => {
      pageFade.classList.add("is-done");
      window.setTimeout(() => {
        pageFade.className = "page-transition";
        setProgress(0);
      }, 320);
    }, 280);
  };

  fadeIn();

  const openPage = async (url) => {
    sessionStorage.setItem("ks-doors", "1");
    await fadeOut();
    window.location.href = url;
  };

  const needsFade = (link, url) => {
    if (!url || url.startsWith("#") || url.startsWith("http") || url.startsWith("mailto:")) return false;
    if (link.target === "_blank") return false;
    return true;
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const url = link.getAttribute("href");
    if (!needsFade(link, url)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    if (menu) {
      menu.classList.remove("is-open");
      if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Menü öffnen");
      }
    }

    openPage(url);
  });

  const escapeHtml = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const blurHeads = new Set([
    ...document.querySelectorAll("[data-blur]"),
    ...document.querySelectorAll(".seiten-hero h1, .abschnitt-intro h2, .statement h2, .prose > h2, .aside-titel"),
  ]);

  blurHeads.forEach((el) => {
    if (el.dataset.blurReady) return;
    el.dataset.blurReady = "1";

    const text = el.textContent.trim();
    if (!text) return;

    el.setAttribute("aria-label", text);
    el.innerHTML = text
      .split(/(\s+)/)
      .map((part) =>
        /^\s+$/.test(part) ? part : `<span class="blur-word"><span>${escapeHtml(part)}</span></span>`
      )
      .join("");

    if (lessMotion) {
      el.classList.add("is-in");
      return;
    }

    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => el.classList.add("is-in"), 80);
            watcher.unobserve(el);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    watcher.observe(el);
  });

  document.querySelectorAll("[data-mask-heading]").forEach((el) => {
    el.classList.add("mask-heading");
    requestAnimationFrame(() => el.classList.add("is-in"));
  });

  document.querySelectorAll(".bild-box").forEach((el) => {
    if (lessMotion) {
      el.classList.add("is-in");
      return;
    }

    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            watcher.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );

    watcher.observe(el);
  });

  if (hasMouse && !lessMotion) {
    document.querySelectorAll(".station").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        row.style.transform = "translateX(2px)";
      });
      row.addEventListener("pointerleave", () => {
        row.style.transform = "";
      });
    });
  }

  const fadeUps = [...document.querySelectorAll("[data-fade], .viral-linie > li")];

  if (fadeUps.length) {
    if (lessMotion) {
      fadeUps.forEach((el) => el.classList.add("is-in"));
    } else {
      const watcher = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const group = el.parentElement
              ? [...el.parentElement.children].filter(
                  (child) => child.hasAttribute("data-fade") || child.matches(".viral-linie > li")
                )
              : [];
            const index = Math.max(0, group.indexOf(el));

            window.setTimeout(() => el.classList.add("is-in"), index * 70);
            watcher.unobserve(el);
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      );

      fadeUps.forEach((el) => watcher.observe(el));
    }
  }

  const leitfragen = document.querySelector("[data-leitfragen]");

  if (leitfragen && !lessMotion) {
    const cards = [...leitfragen.querySelectorAll("[data-frage]")];
    const dots = [...leitfragen.querySelectorAll(".frage-dots i")];
    const counter = leitfragen.querySelector("[data-frage-nr]");
    let current = 0;
    let hideTimer = null;

    const showCard = (index) => {
      if (index === current || index < 0 || index >= cards.length) return;

      const before = current;
      current = index;

      cards[before].classList.remove("is-active");
      cards[before].classList.add("is-exit");
      cards[before].hidden = false;

      cards[index].hidden = false;
      cards[index].classList.remove("is-exit");
      void cards[index].offsetWidth;
      cards[index].classList.add("is-active");

      dots.forEach((dot, n) => dot.classList.toggle("is-on", n === index));
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");

      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        cards.forEach((card, n) => {
          if (n !== current) {
            card.classList.remove("is-exit", "is-active");
            card.hidden = true;
          }
        });
      }, 280);
    };

    const onScroll = () => {
      const box = leitfragen.getBoundingClientRect();
      const travel = leitfragen.offsetHeight - window.innerHeight;
      if (travel <= 0) return;

      const moved = Math.min(Math.max(-box.top, 0), travel);
      const progress = moved / travel;
      const index = Math.min(Math.floor(progress * cards.length), cards.length - 1);
      showCard(index);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  } else if (leitfragen && lessMotion) {
    leitfragen.querySelectorAll("[data-frage]").forEach((card) => {
      card.hidden = false;
      card.classList.add("is-active");
    });
  }

  document.querySelectorAll(".seiten-hero").forEach((hero) => {
    hero.classList.add("seiten-hero--fx");
    hero.querySelectorAll(".seiten-hero__glow").forEach((glow) => glow.remove());
  });

  const rules = document.querySelector("[data-regeln]");

  if (rules) {
    const cards = [...rules.querySelectorAll("[data-regel]")];
    const dots = [...document.querySelectorAll("[data-regeln-dots] i")];
    const prev = rules.querySelector("[data-prev]");
    const next = rules.querySelector("[data-next]");
    let index = 0;

    const show = (nextIndex, direction = 1) => {
      if (nextIndex === index) return;

      const before = index;
      index = (nextIndex + cards.length) % cards.length;

      cards[before].classList.remove("is-active");
      cards[before].classList.add(direction > 0 ? "is-exit-left" : "is-exit-right");
      cards[before].hidden = false;

      cards[index].hidden = false;
      cards[index].classList.remove("is-exit-left", "is-exit-right");
      void cards[index].offsetWidth;
      cards[index].classList.add("is-active");

      dots.forEach((dot, n) => dot.classList.toggle("is-on", n === index));

      window.setTimeout(() => {
        cards.forEach((card, n) => {
          if (n !== index) {
            card.classList.remove("is-active", "is-exit-left", "is-exit-right");
            card.hidden = true;
          }
        });
      }, 280);
    };

    prev?.addEventListener("click", () => show(index - 1, -1));
    next?.addEventListener("click", () => show(index + 1, 1));
    dots.forEach((dot, n) => dot.addEventListener("click", () => show(n, n > index ? 1 : -1)));
  }
})();
