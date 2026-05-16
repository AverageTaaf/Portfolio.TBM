// Addictive Portfolio - Main JS Logic

document.addEventListener("DOMContentLoaded", () => {
  // --- 0. Loading Screen ---
  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar = document.getElementById("loading-bar");
  const loadingProgress = document.querySelector(".loading-progress");
  
  if (loadingScreen && loadingBar && loadingProgress) {
    document.body.style.overflow = "hidden"; // Prevent scrolling while loading
    
    let startTime = null;
    const loadDuration = 2800; // Stay visible for almost 3 seconds
    
    // Smooth easing function
    function easeOutQuart(x) {
      return 1 - Math.pow(1 - x, 4);
    }
    
    function animateLoading(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      let progress = Math.min(elapsed / loadDuration, 1);
      
      const easedProgress = easeOutQuart(progress);
      const currentPercent = Math.min(Math.floor(easedProgress * 100), 100);
      
      loadingBar.style.width = `${easedProgress * 100}%`;
      loadingProgress.textContent = `${currentPercent}%`;
      
      if (progress < 1) {
        requestAnimationFrame(animateLoading);
      } else {
        setTimeout(() => {
          loadingScreen.classList.add("hidden");
          document.body.style.overflow = ""; // Restore scrolling
          
          // Mark page as ready for animations
          document.body.classList.add("page-ready");

          // Trigger entry animations for elements already in viewport
          const revealElements = document.querySelectorAll(".reveal-on-scroll");
          revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
              el.classList.add("is-revealed");
            }
          });
          
          // Restart scanline animation so it plays after loading
          const scanline = document.getElementById("scanline");
          if (scanline) {
            scanline.style.animation = "none";
            void scanline.offsetWidth; // trigger reflow
            scanline.style.animation = "scanline-sweep 3s ease-out forwards";
          }
        }, 800); // Stay at 100% for 800ms
      }
    }
    
    requestAnimationFrame(animateLoading);
  }

  // --- 1. Global State & Context ---
  let curiosityScore = 0;
  const isMobile = window.innerWidth <= 768;

  // Web Audio API setup (lazy load)
  let audioCtx = null;
  function playPopSound() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      } // Audio not supported
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  function triggerHaptic() {
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50); // short vibration
    }
  }

  function updateCuriosity() {
    curiosityScore++;
    document.getElementById("curiosity-score").textContent = curiosityScore;
  }

  // Bind interaction sounds and tracking to everything interactive
  document
    .querySelectorAll(".hover-interactive, a, button, input")
    .forEach((el) => {
      el.addEventListener("click", () => {
        playPopSound();
        triggerHaptic();
        updateCuriosity();
      });

      // Add hover cursor logic
      el.addEventListener("mouseenter", () =>
        document.body.classList.add("hovering"),
      );
      el.addEventListener("mouseleave", () =>
        document.body.classList.remove("hovering"),
      );
    });

  // --- 2. Custom Cursor ---
  const cursorDot = document.getElementById("cursor-dot");
  const cursorRing = document.getElementById("cursor-ring");
  if (!isMobile) {
    window.addEventListener("mousemove", (e) => {
      // Dot follows exactly
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;

      // Ring follows with slight delay using requestAnimationFrame
      requestAnimationFrame(() => {
        cursorRing.style.left = `${e.clientX}px`;
        cursorRing.style.top = `${e.clientY}px`;
      });
    });
  }

  // --- 3. The 5-Second Hook (Typed Effect) ---
  const phrases = [
    "turn complexity into delight",
    "animate your ideas",
    "don't do boring",
    "write code that feels alive",
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typedTextElement = document.getElementById("typed-text");

  function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typedTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typedTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 30 : 80;

    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = 2000; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500; // Pause before new word
    }
    setTimeout(typeEffect, typeSpeed);
    }
    setTimeout(typeEffect, 4000); // Start after loading screen and scanline

  // --- 4. Time and Night Mode ---
  function updateTime() {
    const now = new Date();
    document.getElementById("local-time").textContent = now.toLocaleTimeString(
      "en-US",
      { timeZoneName: "short" },
    );

    // Night mode toggle (post 9 PM local time or before 6 AM)
    const hours = now.getHours();
    if (hours >= 21 || hours < 6) {
      document.body.classList.add("theme-night");
    } else {
      document.body.classList.remove("theme-night");
    }
  }
  setInterval(updateTime, 1000);
  updateTime();

  // --- 5. Scroll Observers & Widgets ---
  const revealElements = document.querySelectorAll(".reveal-on-scroll");
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Only reveal if the loading screen is gone
          if (document.body.classList.contains("page-ready")) {
            entry.target.classList.add("is-revealed");
          }
          // Optional: stop observing once revealed
          // scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );

  revealElements.forEach((el) => scrollObserver.observe(el));

  // Scroll Stamina & UFO Button
  const scrollTopBtn = document.getElementById("scroll-to-top");
  const scrollStamina = document.getElementById("scroll-stamina");

  // Dynamic Pulse
  const pulseValue = document.getElementById("pulse-value");
  let currentPulse = 65;
  let targetPulse = 65;
  const restingPulse = 65;

  setInterval(() => {
    if (targetPulse > restingPulse) targetPulse -= 0.5;
    currentPulse += (targetPulse - currentPulse) * 0.1;
    const jitter = Math.random() * 2 - 1;
    pulseValue.textContent = Math.round(currentPulse + jitter) + " bpm";

    if (currentPulse > 100) {
      pulseValue.classList.add("status-error");
      pulseValue.classList.remove("status-online");
    } else {
      pulseValue.classList.add("status-online");
      pulseValue.classList.remove("status-error");
    }
  }, 100);

  let lastScrollTop = window.scrollY;

  window.addEventListener("scroll", () => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100) || 0;

    scrollStamina.textContent = `${scrollPercentage}%`;

    // Calculate scroll speed for pulse
    const scrollSpeed = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;
    targetPulse = Math.min(140, targetPulse + scrollSpeed * 0.3);

    if (scrollTop > 400) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  window.addEventListener("mousemove", () => {
    targetPulse = Math.min(85, Math.max(targetPulse, targetPulse + 0.2));
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- 6. Skills Bubble Generator ---
  const skills = [
    "JavaScript",
    "CSS3",
    "React",
    "Three.js",
    "UI/UX",
    "Tailwind",
    "HTML5",
    "TypeScript",
  ];
  const skillsContainer = document.getElementById("skills-container");
  skills.forEach((skill) => {
    const bubble = document.createElement("div");
    bubble.className = "skill-bubble hover-interactive";
    bubble.textContent = skill;
    skillsContainer.appendChild(bubble);
  });

  // --- 7. Project Filtering & Lazy Loading & 3D Tilt ---
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      projectCards.forEach((card) => {
        const categories = card.getAttribute("data-category");
        if (filter === "all" || categories.includes(filter)) {
          card.style.display = "block";
          setTimeout(() => (card.style.opacity = "1"), 50);
        } else {
          card.style.opacity = "0";
          setTimeout(() => (card.style.display = "none"), 300);
        }
      });
    });
  });

  // Lazy load
  const lazyImages = document.querySelectorAll(".lazy-load");
  const lazyObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute("data-src");
        img.onload = () => img.classList.add("loaded");
        observer.unobserve(img);
      }
    });
  });
  lazyImages.forEach((img) => lazyObserver.observe(img));

  // 3D Tilt Effect
  if (!isMobile) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  }

  // --- 8. Modals ---
  document.querySelectorAll(".read-more-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetId = btn.getAttribute("data-target");
      document.getElementById(targetId).classList.add("active");
    });
  });
  document.querySelectorAll(".close-modal, .modal-overlay").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("close-modal") ||
        e.target.classList.contains("modal-overlay") ||
        e.target.closest(".close-modal")
      ) {
        document
          .querySelectorAll(".modal-overlay")
          .forEach((modal) => modal.classList.remove("active"));
      }
    });
  });

  // --- 9. Gamified Contact (Riddle & Game) ---
  const riddleInput = document.getElementById("riddle-answer");
  const riddleSubmit = document.getElementById("submit-riddle");
  const riddleFeedback = document.getElementById("riddle-feedback");
  const unlockedContact = document.getElementById("unlocked-contact");
  const riddleView = document.getElementById("riddle-view");
  const gameView = document.getElementById("game-view");
  const riddleQuestionEl = document.getElementById("riddle-question");
  const challengeBtns = document.querySelectorAll(".challenge-btn");

  // Switch between Riddle and Game
  challengeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const challenge = btn.getAttribute("data-challenge");
      challengeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (challenge === "riddle") {
        riddleView.classList.remove("hidden");
        gameView.classList.add("hidden");
      } else {
        riddleView.classList.add("hidden");
        gameView.classList.remove("hidden");
      }
    });
  });

  const riddles = [
    {
      question: "What gets wetter as it dries?",
      answer: "towel",
      hint: "It's very thirsty when you are not.",
    },
    {
      question:
        "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
      answer: "echo",
      hint: "It always agrees with the last thing you said.",
    },
    {
      question: "The more of this there is, the less you see. What is it?",
      answer: "darkness",
      hint: "It's what's left when energy takes a break.",
    },
    {
      question: "What has keys but can't open locks?",
      answer: "piano",
      hint: "It has a lot of ivories, but it isn't an elephant.",
    },
    {
      question: "What has to be broken before you can use it?",
      answer: "egg",
      hint: "Humpty Dumpty would know...",
    },
    {
      question:
        "I’m tall when I’m young, and I’m short when I’m old. What am I?",
      answer: "candle",
      hint: "It shrinks under pressure... and heat.",
    },
    {
      question: "What has words, but never speaks?",
      answer: "book",
      hint: "It has a spine but no bones.",
    },
  ];

  let currentRiddle = riddles[Math.floor(Math.random() * riddles.length)];
  if (riddleQuestionEl) {
    riddleQuestionEl.textContent = currentRiddle.question;
  }

  const hintBtn = document.getElementById("hint-btn");
  const hintTextEl = document.getElementById("riddle-hint-text");

  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      hintTextEl.textContent = "Hint: " + currentRiddle.hint;
      hintTextEl.classList.remove("hidden");
    });
  }

  function unlockContact() {
    riddleView.classList.add("hidden");
    gameView.classList.add("hidden");
    document.querySelector(".challenge-selector").classList.add("hidden");
    unlockedContact.classList.remove("hidden");
    playPopSound();
    if (typeof confetti === "function") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    }
  }

  function checkRiddle() {
    const answer = riddleInput.value.toLowerCase().trim();
    if (answer.includes(currentRiddle.answer)) {
      unlockContact();
    } else {
      riddleFeedback.textContent = "Incorrect. Think harder.";
      riddleFeedback.classList.remove("feedback-error");
      void riddleFeedback.offsetWidth; // trigger reflow
      riddleFeedback.classList.add("feedback-error");
      riddleInput.value = "";
    }
  }

  if (riddleSubmit) {
    riddleSubmit.addEventListener("click", checkRiddle);
    riddleInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkRiddle();
    });
  }

  // --- Neuro-Sync Game Logic ---
  const gameCanvas = document.getElementById("game-canvas");
  const startGameBtn = document.getElementById("start-game");
  const gameStats = document.getElementById("game-stats");
  const gameProgress = document.getElementById("game-progress");
  let score = 0;
  const targetScore = 5;

  function spawnNode() {
    if (score >= targetScore) return;

    const node = document.createElement("div");
    node.className = "game-node hover-interactive";

    const canvasWidth = gameCanvas.offsetWidth;
    const canvasHeight = gameCanvas.offsetHeight;

    const x = Math.random() * (canvasWidth - 40) + 5;
    const y = Math.random() * (canvasHeight - 40) + 5;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    node.addEventListener("click", () => {
      score++;
      gameProgress.textContent = `${score}/${targetScore}`;
      node.remove();
      playPopSound();
      updateCuriosity();

      if (score >= targetScore) {
        unlockContact();
      } else {
        spawnNode();
      }
    });

    gameCanvas.appendChild(node);
  }

  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      document.querySelector(".game-start-overlay").classList.add("hidden");
      gameStats.classList.remove("hidden");
      score = 0;
      gameProgress.textContent = `0/${targetScore}`;
      spawnNode();
    });
  }

  // --- 10. Footer Terminal ---
  const terminalInput = document.getElementById("terminal-input");
  const terminalBody = document.getElementById("terminal-body");

  terminalInput.addEventListener("focus", () => {
    // Ensure the footer is in view when typing
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  });

  terminalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const command = terminalInput.value.trim().toLowerCase();
      const cmdElement = document.createElement("p");
      cmdElement.innerHTML = `<span class="prompt-symbol">$</span> ${command}`;
      terminalBody.appendChild(cmdElement);

      const responseElement = document.createElement("p");

      switch (command) {
        case "help":
          responseElement.innerHTML = `<span class="terminal-response">Available commands: help, projects, contact, clear, sudo</span>`;
          break;
        case "projects":
          responseElement.innerHTML = `<span class="terminal-response">Loading projects... Scroll up to view the selected works.</span>`;
          document
            .getElementById("projects")
            .scrollIntoView({ behavior: "smooth" });
          break;
        case "contact":
          responseElement.innerHTML = `<span class="terminal-response">Solve the riddle above to unlock the transmission channel.</span>`;
          document
            .getElementById("contact")
            .scrollIntoView({ behavior: "smooth" });
          break;
        case "clear":
          terminalBody.innerHTML = "";
          break;
        case "sudo":
          responseElement.innerHTML = `<span class="terminal-error">Nice try. This incident will be reported.</span>`;
          break;
        case "":
          break;
        default:
          responseElement.innerHTML = `<span class="terminal-error">Command not found: ${command}. Type 'help' for options.</span>`;
      }

      if (command !== "" && command !== "clear") {
        terminalBody.appendChild(responseElement);
      }

      terminalInput.value = "";

      // Use requestAnimationFrame to ensure the DOM has updated before scrolling
      requestAnimationFrame(() => {
        terminalBody.scrollTop = terminalBody.scrollHeight;
        // Also scroll the whole window slightly to keep footer pinned if page grew
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  });

  // --- 11. Engagement Confetti (30 sec dwell time) ---
  setTimeout(() => {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.1 },
        colors: ["#3b82f6", "#8b5cf6", "#ec4899"],
      });
      console.log("30 Seconds! You're the curious type.");
    }
  }, 30000);

  // --- 12. Chatbot Logic ---
  const chatButton = document.getElementById("chatbot-button");
  const chatWindow = document.getElementById("chat-window");
  const closeChat = document.getElementById("close-chat");
  const chatInput = document.getElementById("chat-input");
  const sendChat = document.getElementById("send-chat");
  const chatMessages = document.getElementById("chat-messages");

  const botResponses = {
    greeting: [
      "Hi there! I'm Aura, Taafeef's digital companion. How's your day going?",
      "Hello! Ready to explore some cool projects?",
      "Greetings! I can help you find your way around this portfolio.",
      "Hey! I'm powered by pure CSS and a bit of JS magic. What can I do for you?",
    ],
    projects:
      "Taafeef has some amazing work! You should check out **Weatherify AI**, **LocalFlow Calendar**, or the new **Qasas Prophetic**. Which one sounds more interesting? (I can even scroll to them for you!)",
    contact:
      "You can unlock Taafeef's email by solving the riddle in the 'Let's Connect' section. It's a bit of a challenge, but I know you can do it! Or just find him on LinkedIn.",
    skills:
      "Taafeef is a wizard with **JavaScript**, **React**, and **CSS**. He also loves playing with **Three.js** for 3D experiences and **Next.js** for full-stack apps!",
    about:
      "Taafeef is a Creative Front-End Developer and UI/UX Architect. He doesn't just write code; he builds digital experiences that feel alive.",
    qasas:
      "**Qasas Prophetic** is one of Taafeef's latest works! It's a beautiful Next.js site showcasing stories of the Prophets. Would you like me to scroll to it?",
    weatherify:
      "**Weatherify AI** uses OpenAI to give you personalized weather advice. It's like having a meteorologist in your pocket!",
    calendar:
      "**LocalFlow Calendar** is a privacy-first productivity tool. No cloud, no tracking, just pure performance.",
    joke: [
      "Why did the web developer walk out of a restaurant? Because of the table layout.",
      "A SQL query walks into a bar, walks up to two tables, and asks, 'Can I join you?'",
      "Why do programmers always mix up Christmas and Halloween? Because Oct 31 == Dec 25.",
      "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
    ],
    help: "I'm trained to help you with: <br>• **Projects** (ask about specific ones like Qasas or Weatherify)<br>• **Skills** & Tech Stack<br>• **Contact** information<br>• **About** Taafeef<br>• **Jokes** (for a quick laugh!)",
    default:
      "That's interesting! I'm still learning, but you can ask me about projects, skills, or how to contact Taafeef. Try typing 'help' to see what I can do!",
  };

  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.id = "typing-indicator";
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicator;
  }

  function addMessage(text, isBot = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isBot ? "bot-message" : "user-message"}`;
    messageDiv.innerHTML = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    playPopSound();
  }

  function getBotResponse(input) {
    const text = input.toLowerCase();

    // 1. Navigation / Action Keywords
    if (text.includes("scroll") || text.includes("show") || text.includes("go to")) {
      if (text.includes("project")) {
        document.getElementById("projects").scrollIntoView({ behavior: "smooth" });
        return "Sure! Taking you to the projects section now...";
      }
      if (text.includes("contact") || text.includes("email")) {
        document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
        return "Navigating to the contact section. Good luck with the riddle!";
      }
    }

    // 2. Specific Project Queries
    if (text.includes("qasas") || text.includes("prophet")) return botResponses.qasas;
    if (text.includes("weather")) return botResponses.weatherify;
    if (text.includes("calendar") || text.includes("localflow")) return botResponses.calendar;

    // 3. General Categories
    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
      return botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
    }
    if (text.includes("project") || text.includes("work") || text.includes("portfolio")) {
      return botResponses.projects;
    }
    if (text.includes("contact") || text.includes("email") || text.includes("hire") || text.includes("message")) {
      return botResponses.contact;
    }
    if (text.includes("skill") || text.includes("tech") || text.includes("stack") || text.includes("language")) {
      return botResponses.skills;
    }
    if (text.includes("who") || text.includes("about") || text.includes("taafeef") || text.includes("creator")) {
      return botResponses.about;
    }
    if (text.includes("joke") || text.includes("funny") || text.includes("laugh")) {
      return botResponses.joke[Math.floor(Math.random() * botResponses.joke.length)];
    }
    if (text.includes("help") || text.includes("can you") || text.includes("commands")) {
      return botResponses.help;
    }
    if (text.includes("time")) {
      return `Current local time is ${new Date().toLocaleTimeString()}. Time flies when you're exploring code!`;
    }

    // 4. Sentiment Detection (Very basic)
    if (text.includes("cool") || text.includes("awesome") || text.includes("love") || text.includes("nice")) {
      return "Thank you! Taafeef put a lot of heart into this. Glad you're enjoying it!";
    }

    return botResponses.default;
  }

  function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, false);
    chatInput.value = "";

    const typingIndicator = showTypingIndicator();

    setTimeout(() => {
      typingIndicator.remove();
      const response = getBotResponse(text);
      addMessage(response, true);
    }, 1500); // Slightly longer for more realism
  }

  chatButton.addEventListener("click", () => {
    chatWindow.classList.toggle("active");
    if (chatWindow.classList.contains("active")) {
      chatInput.focus();
    }
  });

  closeChat.addEventListener("click", () => {
    chatWindow.classList.remove("active");
  });

  sendChat.addEventListener("click", handleChat);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
  });

  // Suggestion Chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const query = chip.getAttribute("data-query");
      chatInput.value = query;
      handleChat();
      
      // Optional: Hide suggestions after use or keep them
      // document.getElementById('chat-suggestions').style.display = 'none';
    });
  });
});
