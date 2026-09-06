# HandWrite Canvas - Scriere pe Ecran prin Gesturi ale Mânii

**HandWrite Canvas** este o aplicație web interactivă modernă care permite utilizatorilor să deseneze și să scrie în aer pe panză digitală (Canvas), folosind webcam-ul și recunoașterea gesturilor mâinii procesate în timp real via **MediaPipe Hands**.

---

## Funcționalități Principale

- **Scriere prin Gest de Arătare (Pointing Gesture)**:
  - **Activare desenare**: Extindeți degetul arătător în timp ce celelalte degete (mijlociu, inelar, mic) rămân strânse.
  - **Control traseu**: Scrisul urmărește exact coordonatele vârfului degetului arătător (Landmark 8).
  - **Netezire linie (Lerp)**: Interpolare liniară pentru eliminarea tremurului și trasarea de linii fluide.
  - **Stabilizare & Histerezis**: Toleranță integrată pentru a preveni pâlpâirea (flicker-ul) în condiții de iluminare scăzută.

- **Paletă de Culori & Personalizare**:
  - Culori rapide presetate (Roșu Neon, Cyan, Verde, Galben Gold, Mov, Alb).
  - Selector personalizat de culoare (Custom Color Picker HTML5).
  - Slider pentru ajustarea grosimii liniei de desen (1px – 40px).

- **Controale Interfață & Afișaj (Glassmorphism)**:
  - **Sterge Ecran**: Curăță instantaneu panza de desen.
  - **Schelet Mână (Toggle)**: Afișează/ascunde scheletul și articulațiile detectate ale mânii.
  - **Fundal Video (Toggle)**: Comută opacitatea fluxului video de la webcam.
  - **Insignă de Stare**: Afișează în timp real starea sistemului (Inițializare, Mână Detectată, Scriere în curs).
  - **Efect Oglindă (Mirroring)**: Fluxul video și panza sunt oglindite (`scaleX(-1)`) pentru o mișcare naturală și intuitivă.

---

## Tehnologii Utilizate

- **HTML5 & CSS3**: Design modern Dark Mode cu efecte Glassmorphism și variabile CSS.
- **JavaScript (ES6+)**: Logica aplicației, manipulare DOM și Canvas API.
- **MediaPipe Hands**: Librărie Google ML pentru detecția și urmărirea celor 21 de articulații ale mânii în timp real.
- **MediaPipe Camera Utils**: Gestiunea cadrelor webcam la rezoluție HD (1280x720).

---

## Instrucțiuni de Rulare Locală

### Opțiunea 1: Deschidere Directă în Browser
1. Navigați în folderul proiectului.
2. Deschideți fișierul [`index.html`](file:///c:/Users/cpop2/Desktop/Proiect%20RSF/index.html) în orice browser modern (Chrome, Edge, Firefox, Brave).
3. Acordați permisiunea de acces la camera web când sunteți solicitat.

### Opțiunea 2: Rulare prin Server Web Local (Recomandat)
Puteți folosi un server HTTP local (de ex. Live Server în VS Code, Python sau Node.js):

- **Python**:
  ```bash
  python -m http.server 8000
  ```
  Accesați `http://localhost:8000` în browser.