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
