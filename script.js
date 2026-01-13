// --- Effet Machine à Écrire (Typing Effect) ---
const textElement = document.getElementById('typing-text');
const texts = ["BIENVENUE SUR MON PORTFOLIO", "ADMIN SYSTÈME & RÉSEAU", "ETUDIANT IUT ANNECY"];
let count = 0;
let index = 0;
let currentText = "";
let letter = "";

(function type() {
    if (count === texts.length) {
        count = 0; // Boucle infinie
    }
    currentText = texts[count];
    letter = currentText.slice(0, ++index);

    textElement.textContent = letter + "|"; // Curseur

    if (letter.length === currentText.length) {
        count++;
        index = 0;
        setTimeout(type, 2000); // Pause à la fin du mot
    } else {
        setTimeout(type, 100); // Vitesse de frappe
    }
})();

// --- Modales Projets ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Fermer la modale si on clique en dehors
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// --- Validation Formulaire Contact ---
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const msg = document.getElementById('message').value;
    const feedback = document.getElementById('form-feedback');

    if(name.length < 2 || !email.includes('@') || msg.length < 5) {
        feedback.style.color = 'red';
        feedback.textContent = "ERREUR: DONNÉES INVALIDES. VEUILLEZ VÉRIFIER.";
    } else {
        // Simulation d'envoi
        feedback.style.color = '#00ff41';
        feedback.textContent = "TRANSMISSION RÉUSSIE. MESSAGE ENVOYÉ.";
        this.reset();
        
        // Ici, vous pourriez ajouter un vrai appel AJAX/Fetch
    }
});

// --- Animation Footer au Scroll ---
window.addEventListener('scroll', () => {
    const footer = document.querySelector('footer');
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        footer.style.opacity = '1';
        footer.style.transform = 'translateY(0)';
    }
});
// --- CURSEUR CUSTOM CYBERPUNK ---

const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

// 1. Mouvement de la souris
window.addEventListener('mousemove', function(e) {
    const posX = e.clientX;
    const posY = e.clientY;

    // Le point suit instantanément
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // L'anneau suit avec une petite animation (delay)
    // On utilise 'animate' pour une fluidité native sans lag
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// 2. Détection du survol (Hover)
// On sélectionne tous les éléments cliquables
const interactables = document.querySelectorAll('a, button, input, textarea, .project-card, .btn-download');

interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        document.body.classList.add('hovering');
        // Optionnel : changer le texte du curseur ou sa forme ici
    });
    el.addEventListener('mouseleave', () => {
        document.body.classList.remove('hovering');
    });
});

// 3. Effet au clic (Click)
window.addEventListener('mousedown', () => {
    document.body.classList.add('clicking');
});

window.addEventListener('mouseup', () => {
    document.body.classList.remove('clicking');
});