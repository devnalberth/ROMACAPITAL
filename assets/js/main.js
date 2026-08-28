(function($) {
    "use strict";
  
    const $documentOn = $(document);
    const $windowOn = $(window);
  
    $documentOn.ready( function() {
  
 /* ================================
       Mobile Menu Js Start
    ================================ */
    
      $('#mobile-menu').meanmenu({
        meanMenuContainer: '.mobile-menu',
        meanScreenWidth: "1199",
        meanExpand: ['<i class="far fa-plus"></i>'],
    });

       $('#mobile-menus').meanmenu({
        meanMenuContainer: '.mobile-menus',
        meanScreenWidth: "19920",
        meanExpand: ['<i class="far fa-plus"></i>'],
    });

     

        /* ================================
        Body Overlay Js Start
        ================================ */

        $(".body-overlay").on("click", function () {
        $(".offcanvas__area").removeClass("offcanvas-opened");
        $(".df-search-area").removeClass("opened");
        $(".body-overlay").removeClass("opened");

        // Show sticky item when overlay clicked
        $(".sidebar-sticky-item").fadeIn().addClass("active");
        });

      /* ================================
       Sticky Header Js Start
    ================================ */

      const stickyHeader = document.getElementById("header-sticky");
      const backToTop = document.getElementById("back-top");
      let scrollFramePending = false;

      const updateScrollUi = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        if (stickyHeader) {
          stickyHeader.classList.toggle("sticky", scrollTop > 250);
        }

        if (backToTop) {
          const reachedBottom = scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 10;
          backToTop.classList.toggle("show", reachedBottom);
        }

        scrollFramePending = false;
      };

      window.addEventListener("scroll", () => {
        if (!scrollFramePending) {
          window.requestAnimationFrame(updateScrollUi);
          scrollFramePending = true;
        }
      }, { passive: true });

      updateScrollUi();
      
      /* ================================
       Video & Image Popup Js Start
    ================================ */

      if ($.fn.magnificPopup && $(".img-popup").length) $(".img-popup").magnificPopup({
        type: "image",
        gallery: {
          enabled: true,
        },
      });

      if ($.fn.magnificPopup && $(".video-popup").length) $(".video-popup").magnificPopup({
        type: "iframe",
        callbacks: {},
      });
  
      /* ================================
       Counterup Js Start
    ================================ */

      if ($.fn.counterUp && $(".count").length) $(".count").counterUp({
        delay: 15,
        time: 4000,
      });
  
      /* ================================
       Wow Animation Js Start
    ================================ */

      new WOW().init();
  
      /* ================================
       Nice Select Js Start
    ================================ */

    if ($.fn.niceSelect && $('.single-select').length) {
        $('.single-select').niceSelect();
    }

    /* ================================
       Progress Bar Js Start
    ================================ */

    if ($.fn.waypoint && $('.progress-bar').length) $('.progress-bar').waypoint(function() {
        $('.progress-bar').css({
            animation: "animate-positive 2.6s",
            opacity: "1"
        });
    }, { offset: '75%' });

     /* ================================
      Custom Accordion Js Start
    ================================ */

    if ($('.accordion-box').length) {
    $(".accordion-box").on('click', '.acc-btn', function () {
        var outerBox = $(this).closest('.accordion-box');
        var target = $(this).closest('.accordion');
        var accBtn = $(this);
        var accContent = accBtn.next('.acc-content');

        if (target.hasClass('active-block')) {
            // Close this one
            accBtn.removeClass('active');
            target.removeClass('active-block');
            accContent.slideUp(300);
        } else {
            // Close all others
            outerBox.find('.accordion').removeClass('active-block');
            outerBox.find('.acc-btn').removeClass('active');
            outerBox.find('.acc-content').slideUp(300);

            // Open clicked one
            accBtn.addClass('active');
            target.addClass('active-block');
            accContent.slideDown(300);
        }
    });
    }

     /* ================================
       Banner Active Js Start
    ================================ */

       if($('.banner-active').length > 0) {
            const bannerActive = new Swiper(".banner-active", {
                speed: 1500,
                loop: true,
                slidesPerView: 1,
                effect:'fade',
                autoplay: {
                    delay: 1500,         
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,  
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
            });
        }

       /* ================================
       Brand Slider Js Start
    ================================ */
     if($('.brand-slider').length > 0) {
        const brandSlider = new Swiper(".brand-slider", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 6,
                },
                991: {
                    slidesPerView: 5,
                },
                767: {
                    slidesPerView: 4,
                },
                575: {
                    slidesPerView: 3,
                },
                400: {
                    slidesPerView: 2,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }
    
      /* ================================
       Testimonial Slider Js Start
    ================================ */
      if($('.testimonial-slider-1').length > 0) {
        const testimonialSlider1 = new Swiper(".testimonial-slider-1", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },

            pagination: {
                el: ".dot2",
                clickable: true,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 3,
                },
                991: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }

       if($('.testimonial-slider-2').length > 0) {
        const testimonialSlider2 = new Swiper(".testimonial-slider-2", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".dot2",
                clickable: true,
            },
             navigation: {
                prevEl: ".array-prev",
                nextEl: ".array-next",
            },
        });
      }

      if($('.testimonial-slider-3').length > 0) {
        const testimonialSlider3 = new Swiper(".testimonial-slider-3", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
             navigation: {
                prevEl: ".array-prev",
                nextEl: ".array-next",
            },
            pagination: {
                el: ".dot",
                clickable: true,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 3,
                },
                991: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }

      if($('.testimonial-slider-5').length > 0) {
        const testimonialSlider5 = new Swiper(".testimonial-slider-5", {
            spaceBetween: 30,
            speed: 1500,
            loop: true,
            autoplay: {
                delay: 1500,
                disableOnInteraction: false,
            },
            navigation: {
                prevEl: ".array-prev",
                nextEl: ".array-next",
            },
        
        });
      }

       if($('.testimonial-slider-10').length > 0) {
        const testimonialSlider10 = new Swiper(".testimonial-slider-10", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },

           navigation: {
                prevEl: ".array-prev",
                nextEl: ".array-next",
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 2,
                },
                991: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }

      /* ================================
       Service Slider Js Start
    ================================ */

    if($('.service-slider-5').length > 0) {
        const serviceSlider5 = new Swiper(".service-slider-5", {
            spaceBetween: 30,
            speed: 1500,
            loop: true,
            autoplay: {
                delay: 1500,
                disableOnInteraction: false,
            },

            pagination: {
                el: ".dot2",
                clickable: true,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 4,
                },
                991: {
                    slidesPerView: 3,
                },
                767: {
                    slidesPerView: 1.6,
                },
                575: {
                    slidesPerView: 1.5,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }
    
    /* ================================
       Project Slider Js Start
    ================================ */
    if ($('.project-slider').length > 0) {

        const projectSlider = new Swiper(".project-slider", {
            slidesPerView: 4,
            spaceBetween: 0,
            speed: 1000,
            loop: false,

            breakpoints: {
                1599: {
                    slidesPerView: 4,
                },
                1399: {
                    slidesPerView: 3.5,
                },
                1199: {
                    slidesPerView: 3,
                },
                991: {
                    slidesPerView: 2,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1.4,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
    }

     if($('.project-slider-5').length > 0) {
        const projectSlider5 = new Swiper(".project-slider-5", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },

            pagination: {
                el: ".dot2",
                clickable: true,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 4,
                },
                991: {
                    slidesPerView: 3,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1.5,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
      }

      if($('.project-slider-10').length > 0) {
        const projectSlider10 = new Swiper(".project-slider-10", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },

            pagination: {
                el: ".dot2",
                clickable: true,
            },
          
            breakpoints: {
                1599: {
                    slidesPerView: 4,
                },
                1399: {
                    slidesPerView: 3.7,
                },
                1199: {
                    slidesPerView: 3.1,
                },
                991: {
                    slidesPerView: 3,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
    }

    if($('.project-slider-11').length > 0) {
        const projectSlider11 = new Swiper(".project-slider-11", {
            spaceBetween: 30,
            speed: 1300,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },

            pagination: {
                el: ".dot2",
                clickable: true,
            },
          
            breakpoints: {
                1199: {
                    slidesPerView: 3,
                },
                991: {
                    slidesPerView: 3,
                },
                767: {
                    slidesPerView: 2,
                },
                575: {
                    slidesPerView: 1.5,
                },
                0: {
                    slidesPerView: 1,
                },
            },
        });
    }

    /* ================================
     Service Box Js Start
    ================================ */

    if (document.querySelectorAll(".service-box-4").length) {
    const serviceBox4 = document.querySelectorAll(".service-box-4");

    serviceBox4.forEach((box) => {
        const hoverImg = box.querySelector(".hover-image");
        if (!hoverImg) return;

        box.addEventListener("mousemove", (event) => {
        const rect = box.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        hoverImg.style.opacity = "1";
        hoverImg.style.visibility = "visible";
        hoverImg.style.transform = `translate(${x}px, ${y}px) rotate(10deg)`;
        });

        box.addEventListener("mouseleave", () => {
        hoverImg.style.opacity = "0";
        hoverImg.style.visibility = "hidden";
        hoverImg.style.transform = `translateY(-50%) rotate(10deg)`;
        });
    });
    }

    /* ================================
           Project Slider Hover Tab
    ================================ */

    $documentOn.on("mouseenter click", ".project-slider .swiper-slide", function () {

        var tab_id = $(this).data("tab");

        $(".project-slider .swiper-slide").removeClass("active");
        $(this).addClass("active");

        $(".project-hover-image .tab-img").removeClass("active");
        $("#" + tab_id).addClass("active");

    });

     /* ================================
           Circle Progressbar Js Start
        ================================ */

        function animateCircle(el) {

            if (!el || el.classList.contains("animated")) return;

            var percent = parseInt(el.getAttribute("data-percent"), 10);

            if (isNaN(percent) || percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            var circle = el.querySelector(".progress");
            var value  = el.querySelector(".value");

            if (!circle || !value) return;

            var radius = circle.r && circle.r.baseVal
                ? circle.r.baseVal.value
                : circle.getAttribute("r");

            if (!radius) return;

            var circumference = 2 * Math.PI * radius;

            circle.style.strokeDasharray  = circumference;
            circle.style.strokeDashoffset = circumference;

            // Trigger reflow
            circle.getBoundingClientRect();

            var offset = circumference * (1 - percent / 100);

            circle.style.transition      = "stroke-dashoffset 1.2s ease";
            circle.style.strokeDashoffset = offset;

            var count     = 0;
            var duration  = 1200;
            var stepTime  = percent > 0 ? Math.floor(duration / percent) : duration;

            var counter = setInterval(function () {

                if (count >= percent) {
                    clearInterval(counter);
                    el.classList.add("animated");
                } else {
                    count++;
                    value.textContent = count + "%";
                }

            }, stepTime);
        }

        if ("IntersectionObserver" in window) {

            var observer = new IntersectionObserver(function (entries, obs) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {
                        animateCircle(entry.target);
                        obs.unobserve(entry.target);
                    }

                });

            }, {
                threshold: 0.5
            });

            $(".circle-progress").each(function () {
                observer.observe(this);
            });

        } else {

            // Fallback for older browsers
            $(".circle-progress").each(function () {
                animateCircle(this);
            });

        }

    /* ================================
        Mouse Cursor Animation Js Start
    ================================ */

    if ($(".mouseCursor").length > 0) {
        function itCursor() {
            var myCursor = jQuery(".mouseCursor");
            if (myCursor.length) {
                if ($("body")) {
                    const e = document.querySelector(".cursor-inner"),
                        t = document.querySelector(".cursor-outer");
                    let n, i = 0, o = !1;
                    window.onmousemove = function(s) {
                        if (!o) {
                            t.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)";
                        }
                        e.style.transform = "translate(" + s.clientX + "px, " + s.clientY + "px)";
                        n = s.clientY;
                        i = s.clientX;
                    };
                    $("body").on("mouseenter", "button, a, .cursor-pointer", function() {
                        e.classList.add("cursor-hover");
                        t.classList.add("cursor-hover");
                    });
                    $("body").on("mouseleave", "button, a, .cursor-pointer", function() {
                        if (!($(this).is("a", "button") && $(this).closest(".cursor-pointer").length)) {
                            e.classList.remove("cursor-hover");
                            t.classList.remove("cursor-hover");
                        }
                    });
                    e.style.visibility = "visible";
                    t.style.visibility = "visible";
                }
            }
        }
        itCursor();
    }

    /* ================================
        Back To Top Button Js Start
    ================================ */
    $documentOn.on('click', '#back-top', function() {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });

    /* ================================
       Search Popup Toggle Js Start
    ================================ */

    if ($(".search-toggler").length) {
        $(".search-toggler").on("click", function(e) {
            e.preventDefault();
            $(".search-popup").toggleClass("active");
            $("body").toggleClass("locked");
        });
    }
      

      /* ================================
       Smooth Scroller And Title Animation Js Start
    ================================ */
    if ($('#smooth-wrapper').length && $('#smooth-content').length) {
        gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

        gsap.config({
            nullTargetWarn: false,
        });

        let smoother = ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 2,
            effects: true,
            smoothTouch: 0.1,
            normalizeScroll: false,
            ignoreMobileResize: true,
        });

        const romaSectionHashes = ["#estrategias", "#como-funciona"];

        function revealAnchoredSection(target) {
            target.querySelectorAll(".wow").forEach(function(element) {
                element.style.visibility = "visible";
                element.classList.add("animated");
            });

            if (typeof gsap !== "undefined") {
                gsap.set(target.querySelectorAll(".split-title .char, .tz-sub-tilte .char"), {
                    opacity: 1,
                    x: 0,
                    clipPath: "inset(0% 0% -15% 0%)"
                });
            }
        }

        function scrollToRomaSection(hash, updateHistory) {
            if (!romaSectionHashes.includes(hash)) return;

            const target = document.querySelector(hash);
            if (!target) return;

            if (updateHistory && window.location.hash !== hash) {
                window.history.pushState(null, "", hash);
            }

            ScrollTrigger.refresh();
            smoother.scrollTo(target, false, "top 112px");

            requestAnimationFrame(function() {
                revealAnchoredSection(target);
                ScrollTrigger.update();
                window.dispatchEvent(new Event("scroll"));
            });
        }

        $documentOn.on("click", 'a[href="#estrategias"], a[href="#como-funciona"]', function(event) {
            const hash = this.getAttribute("href");

            if (document.querySelector(hash)) {
                event.preventDefault();
                scrollToRomaSection(hash, true);
            }
        });

        function syncInitialRomaSection() {
            if (!romaSectionHashes.includes(window.location.hash)) return;

            window.setTimeout(function() {
                scrollToRomaSection(window.location.hash, false);
            }, 120);
        }

        if (document.readyState === "complete") {
            syncInitialRomaSection();
        } else {
            window.addEventListener("load", syncInitialRomaSection, { once: true });
        }

        window.addEventListener("hashchange", syncInitialRomaSection);
    }

    /* ================================
       Text Anim Js Start
    ================================ */

      if (
    typeof SplitText !== "undefined" &&
        document.querySelectorAll(".split-title").length > 0
        ) {
    document.querySelectorAll(".split-title").forEach((title) => {

        // split by words + chars (IMPORTANT)
        const split = new SplitText(title, {
        type: "words,chars"
        });

        // add class to chars
        split.chars.forEach((char) => {
        char.classList.add("char");
        });

        // GSAP animation
        gsap.to(split.chars, {
        scrollTrigger: {
            trigger: title,
            start: "top 90%",
            toggleActions: "play none none none"
        },
        duration: 0.8,
        clipPath: "inset(0% 0% -15% 0%)",
        x: 0,
        opacity: 1,
        ease: "power4.out",
        stagger: 0.03
        });

    });
    }

     if (typeof gsap !== "undefined") {
          gsap.registerPlugin(ScrollTrigger, SplitText);

          let mm = gsap.matchMedia();

          mm.add("(min-width: 1200px)", () => {

              let splits = [];

              // ===== tz-sub-tilte =====
              $('.tz-sub-tilte').each(function (index, el) {

              let split = new SplitText(el, {
                  type: "lines,words,chars",
                  linesClass: "split-line"
              });

              splits.push(split);

              gsap.set(split.chars, {
                  opacity: 0,
                  x: 7
              });

              gsap.to(split.chars, {
                  scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  end: "top 60%",
                  scrub: 1
                  },
                  x: 0,
                  opacity: 1,
                  duration: 0.7,
                  stagger: 0.2
              });
              });

              // ===== tz-itm-title =====
              $('.tz-itm-title').each(function (index, el) {

              let split = new SplitText(el, {
                  type: "lines,words,chars",
                  linesClass: "split-line"
              });

              splits.push(split);

              gsap.set(split.chars, {
                  opacity: 0.3,
                  x: -7
              });

              gsap.to(split.chars, {
                  scrollTrigger: {
                  trigger: el,
                  start: "top 92%",
                  end: "top 60%",
                  scrub: 1
                  },
                  x: 0,
                  opacity: 1,
                  duration: 0.7,
                  stagger: 0.2
              });
              });

              // ðŸ”¥ MOST IMPORTANT PART
              ScrollTrigger.refresh();

              // ðŸ”¥ cleanup on breakpoint change
              return () => {
              splits.forEach(split => split.revert());
              ScrollTrigger.getAll().forEach(st => st.kill());
              };

          });
    }

    /* ================================
       Sticky Js Start
    ================================ */

    let pr = gsap.matchMedia();
	pr.add("(min-width: 1199px)", () => {
		let tl = gsap.timeline();
		let panels = document.querySelectorAll('.tp-panel-pin')
		panels.forEach((section, index) => {
			tl.to(section, {
				scrollTrigger: {
					trigger: section,
					pin: section,
					scrub: 1,
					start: 'top 14%',
					end: "bottom 65%",
					endTrigger: '.tp-panel-pin-area',
					pinSpacing: false,
					markers: false,
				},
			})
		})
	});

     let pr2 = gsap.matchMedia();
    pr2.add("(min-width: 1199px)", () => {
        let tl = gsap.timeline();
        let panels = document.querySelectorAll('.tp-panel-pin2');
        panels.forEach((section, index) => {
            tl.to(section, {
                scrollTrigger: {
                    trigger: section,
                    pin: section,
                    scrub: 1,
                    start: 'top 15%',
                    end: 'bottom 95%',
                    endTrigger: '.tp-panel-pin-area2',
                    pinSpacing: false,
                    markers: false,
                },
            });
        });
    });

     /* ================================
       Approach Anim Js Start
    ================================ */

    if (document.querySelectorAll(".approach-area").length > 0) {

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1199px)", () => {

        const boxes = document.querySelectorAll(".approach-area .approach-box");

        gsap.from(boxes, {
            x: "100%",
            duration: 1,
            stagger: 0.3,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".approach-wrapper-box",
                start: "top 100%",
                end: "bottom 40%",
                scrub: 2,
                toggleActions: "play none none reverse",
            },
        });

    });
    }

     /* ================================
       Des Portfolio Anim Js Start
    ================================ */
    
    if (document.querySelector(".des-portfolio-wrap")) {
        const pr = ScrollTrigger.matchMedia();

        pr.add("(min-width: 1199px)", () => {

            const sections = document.querySelectorAll(".des-portfolio-panel");
            const wrap = document.querySelector(".des-portfolio-wrap");

            if (!sections.length || !wrap) return;

            // Initial state
            gsap.set(sections, { scale: 1 });

            // Animate each section except the last one
            sections.forEach((section, index) => {
                const isLast = index === sections.length - 1;

                gsap.to(section, {
                    scale: isLast ? 1 : 0.8,
                    ease: "none",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 14%",
                        end: "bottom 80%",
                        scrub: true,
                        pin: true,
                        pinSpacing: false,
                        endTrigger: wrap,
                        markers: false,
                    },
                });
            });

            // Cleanup on condition change
            return () => {
                ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            };
        });
    }

    

    }); // End Document Ready Function


    $windowOn.on("load", function () {
        if (typeof wowController === "function") {
            wowController();
        }
        if (typeof gsapController === "function") {
            gsapController();
        }
    });




  
  })(jQuery); // End jQuery


