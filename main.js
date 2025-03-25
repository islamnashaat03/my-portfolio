// Show Mobile Menu

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document
      .querySelector(this.getAttribute("href"))
      .scrollIntoView({ behavior: "smooth" });

    // Close mobile menu if open
    if (nav.classList.contains("show")) {
      nav.classList.remove("show");
    }
  });
});

// Mobile Menu Functionality
const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", () => {
  menuBtn.classList.toggle("opened");
  navLinks.classList.toggle("show");
  // if (nav.classList.contains("show")) {
  //   navLinks.style.display = "flex";
  // } else {
  //   setTimeout(() => {
  //     navLinks.style.display = "none";
  //   }, 200);
  // }
});

// Active Navigation Link Highlight
const sections = document.querySelectorAll("section");
const navItems = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute("id");
    }
  });

  navItems.forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("href").slice(1) === current) {
      item.classList.add("active");
    }
  });
});

// Projects Filter Animation
const filterBtns = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    filterBtns.forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");

    const category = btn.getAttribute("data-filter");

    projectCards.forEach((card) => {
      // Add fade out animation
      card.style.opacity = "0";
      card.style.transform = "scale(0.8)";

      setTimeout(() => {
        if (
          category === "all" ||
          card.getAttribute("data-category").includes(category)
        ) {
          card.style.display = "flex";
          // Add fade in animation
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          }, 50);
        } else {
          card.style.display = "none";
        }
      }, 300);
    });
  });
});

// Form Validation and Submission
const contactForm = document.getElementById("contact-form");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);
  const formProps = Object.fromEntries(formData);

  // Basic validation
  let isValid = true;
  const email = formProps.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address");
    isValid = false;
  }

  if (formProps.message.length < 10) {
    alert("Message must be at least 10 characters long");
    isValid = false;
  }

  if (isValid) {
    // Here you would typically send the form data to a server
    // For now, we'll just show a success message
    alert("Message sent successfully!");
    contactForm.reset();
  }
});

// Typing Animation for Hero Section
const typingText = document.querySelector(".typing-text");
const phrases = [
  "I build amazing web experiences",
  "I create responsive designs",
  "I develop WordPress solutions",
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const currentPhrase = phrases[phraseIndex];

  if (isDeleting) {
    typingText.textContent = currentPhrase.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingText.textContent = currentPhrase.substring(0, charIndex + 1);
    charIndex++;
  }

  if (!isDeleting && charIndex === currentPhrase.length) {
    isDeleting = true;
    setTimeout(typeEffect, 200);
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(typeEffect, 500);
  } else {
    setTimeout(typeEffect, isDeleting ? 100 : 200);
  }
}

// Start typing animation
typeEffect();

// Canvas Animation
class ParticleCanvas {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.mousePosition = {
      x: null,
      y: null,
      radius: 150,
    };

    this.init();
  }

  init() {
    // Add canvas to the hero section
    const hero = document.querySelector(".hero");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.zIndex = "0";
    hero.insertBefore(this.canvas, hero.firstChild);

    // Set canvas size
    this.resize();

    // Create particles
    this.createParticles();

    // Event listeners
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));

    // Start animation
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Recreate particles on resize
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    const numberOfParticles = Math.floor(
      (this.canvas.width * this.canvas.height) / 15000
    );

    for (let i = 0; i < numberOfParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: "#237aaf",
      });
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x = e.clientX - rect.left;
    this.mousePosition.y = e.clientY - rect.top;
  }

  drawParticles() {
    this.particles.forEach((particle) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around edges
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.y > this.canvas.height) particle.y = 0;
      if (particle.y < 0) particle.y = this.canvas.height;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();

      // Connect particles
      this.particles.forEach((otherParticle) => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(35, 122, 175, ${1 - distance / 100})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(otherParticle.x, otherParticle.y);
          this.ctx.stroke();
        }

        // Mouse interaction
        if (this.mousePosition.x != null) {
          const dx = particle.x - this.mousePosition.x;
          const dy = particle.y - this.mousePosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.mousePosition.radius) {
            const force =
              (this.mousePosition.radius - distance) /
              this.mousePosition.radius;
            const directionX = dx / distance;
            const directionY = dy / distance;
            particle.x += directionX * force;
            particle.y += directionY * force;
          }
        }
      });
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize canvas when the page loads
window.addEventListener("load", () => {
  new ParticleCanvas();
});



const logo = document.querySelectorAll('svg path, svg polygon');
// console.log(logo);
for (let i = 0; i < logo.length; i++) {
  console.log(`letter ${i} is ${logo[i].getTotalLength()}`);
}
/**
 * Fade out the loader after the page has finished loading
 */
function fadeLoader() {
  // Get the loader element and its SVG child
  const loader = document.querySelector('.loader');
  const svg = loader.querySelector('svg');

  // Set the opacity of the loader and SVG back to 1
  loader.style.opacity = 1;
  svg.style.opacity = 1;

  /**
   * Recursive function to fade out the loader
   */
  const fadeOut = () => {
    // Decrease the opacity by 0.01
    if ((loader.style.opacity -= 0.01) < 0) {
      // If the opacity is 0, hide the loader and SVG
      loader.style.display = 'none';
      svg.style.display = 'none';
    } else {
      // Otherwise, call the function again after a short delay
      requestAnimationFrame(fadeOut);
    }
  };

  // Start the fade out after a short delay
  setTimeout(() => requestAnimationFrame(fadeOut), 2000);
}
window.addEventListener("load", fadeLoader);

