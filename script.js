/* =====================================================
   MES VOYAGES
===================================================== */

const STORAGE_KEY = "voyages-v1-refonte";

/* =====================================================
   OUTILS
===================================================== */

function getVoyages() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveVoyages(voyages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voyages));
}


/* =====================================================
   COMPRESSION PHOTO
===================================================== */

function compresserPhoto(file) {

    return new Promise((resolve, reject) => {

        const lecteur = new FileReader();

        lecteur.onload = function () {

            const image = new Image();

            image.onload = function () {

                const MAX_SIZE = 1200;

                let largeur = image.width;
                let hauteur = image.height;

                /* Réduction uniquement si nécessaire */

                if (largeur > MAX_SIZE || hauteur > MAX_SIZE) {

                    if (largeur > hauteur) {
                        hauteur = Math.round(
                            hauteur * MAX_SIZE / largeur
                        );

                        largeur = MAX_SIZE;

                    } else {
                        largeur = Math.round(
                            largeur * MAX_SIZE / hauteur
                        );

                        hauteur = MAX_SIZE;
                    }
                }

                const canvas = document.createElement("canvas");

                canvas.width = largeur;
                canvas.height = hauteur;

                const contexte = canvas.getContext("2d");

                contexte.drawImage(
                    image,
                    0,
                    0,
                    largeur,
                    hauteur
                );

                /*
                   JPEG qualité 75%.
                   La photo est donc fortement allégée
                   tout en restant nette sur téléphone.
                */

                const photoCompressee = canvas.toDataURL(
                    "image/jpeg",
                    0.75
                );

                resolve(photoCompressee);
            };

            image.onerror = reject;

            image.src = lecteur.result;
        };

        lecteur.onerror = reject;

        lecteur.readAsDataURL(file);
    });
}


/* =====================================================
   PAGE AJOUTER
===================================================== */

const formulaire = document.querySelector(".formulaire-voyage");

if (formulaire) {

    const champPays = document.getElementById("pays");
    const champVille = document.getElementById("ville");
    const champDate = document.getElementById("date");
    const champPhoto = document.getElementById("photo");
    const boutonEnregistrer =
        document.getElementById("enregistrer");

    boutonEnregistrer.addEventListener("click", async () => {

        const pays = champPays.value.trim();
        const ville = champVille.value.trim();
        const date = champDate.value;
        const fichier = champPhoto.files[0];

        /* Vérification */

        if (!pays || !ville || !date || !fichier) {

            alert("Merci de compléter tous les champs.");

            return;
        }

        /*
           On désactive le bouton pendant la compression
           pour éviter un double enregistrement.
        */

        boutonEnregistrer.disabled = true;
        boutonEnregistrer.textContent = "Enregistrement...";

        try {

            const photo = await compresserPhoto(fichier);

            const voyages = getVoyages();

            const nouveauVoyage = {

                id: Date.now(),

                pays: pays,

                ville: ville,

                date: date,

                photo: photo
            };

            voyages.push(nouveauVoyage);

            saveVoyages(voyages);

            /*
               Retour automatique à Mes voyages
            */

            window.location.href = "mes-voyages.html";

        } catch (erreur) {

            console.error(erreur);

            alert("Impossible de traiter la photo.");

            boutonEnregistrer.disabled = false;

            boutonEnregistrer.textContent =
                "Enregistrer le voyage";
        }
    });
}


/* =====================================================
   FORMATAGE DATE
===================================================== */

function formaterDate(date) {

    const morceaux = date.split("-");

    if (morceaux.length !== 3) {
        return date;
    }

    return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
}


/* =====================================================
   PAGE MES VOYAGES
===================================================== */

const listeVoyages = document.querySelector(".liste-voyages");

if (listeVoyages) {

    afficherVoyages();
}


function afficherVoyages() {

    const voyages = getVoyages();

    listeVoyages.innerHTML = "";

    /*
       Du plus proche au plus lointain
    */

    voyages.sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    });

    if (voyages.length === 0) {

        listeVoyages.innerHTML = `
            <div class="aucun-voyage">
                Aucun voyage enregistré.
            </div>
        `;

        return;
    }

    voyages.forEach(voyage => {

        const carte = document.createElement("div");

        carte.className = "carte-voyage";

        carte.innerHTML = `

            <img
                class="fond-carte-voyage"
                src="cadre-voyage.png"
                alt=""
            >

            <div class="photo-carte-voyage">
                <img
                    src="${voyage.photo}"
                    alt=""
                >
            </div>

            <div class="infos-carte-voyage">

                <div class="pays-carte">
                    ${echapperHTML(voyage.pays)}
                </div>

                <div class="ville-carte">
                    ${echapperHTML(voyage.ville)}
                </div>

                <div class="date-carte">
                    ${formaterDate(voyage.date)}
                </div>

            </div>

        `;

        listeVoyages.appendChild(carte);
    });
}


/* =====================================================
   PROTECTION DU TEXTE
===================================================== */

function echapperHTML(texte) {

    const div = document.createElement("div");

    div.textContent = texte;

    return div.innerHTML;
}


/* =====================================================
   PAGE ACCUEIL
===================================================== */

const prochainVoyage =
    document.getElementById("prochainVoyage");

if (prochainVoyage) {

    afficherProchainVoyage();
}

function afficherProchainVoyage() {

    const voyages = getVoyages();

    if (voyages.length === 0) {
        return;
    }

    const aujourdHui = new Date();

    aujourdHui.setHours(0, 0, 0, 0);

    /*
       On garde uniquement les voyages
       dont la date est aujourd'hui ou dans le futur.
    */

    const voyagesAVenir = voyages
        .filter(voyage => {

            const dateVoyage =
                new Date(voyage.date + "T00:00:00");

            return dateVoyage >= aujourdHui;
        })
        .sort((a, b) => {

            return new Date(a.date + "T00:00:00")
                 - new Date(b.date + "T00:00:00");
        });


    /*
       Le premier est donc le voyage actuel/prochain.
    */

    if (voyagesAVenir.length === 0) {

        /*
           Tous les voyages sont passés.
           On affiche alors le plus récent.
        */

        voyages.sort((a, b) => {

            return new Date(b.date + "T00:00:00")
                 - new Date(a.date + "T00:00:00");
        });

        afficherVoyageAccueil(voyages[0]);

        return;
    }


    afficherVoyageAccueil(voyagesAVenir[0]);
}

function afficherVoyageAccueil(voyage) {

    const photo =
        document.getElementById("photoProchainVoyage");

    const tampon =
        document.getElementById("tamponVoyage");

    const tamponDate =
        document.getElementById("tamponDate");

    const infos =
        document.getElementById("infosProchainVoyage");

    const infoPays =
        document.getElementById("infoPays");

    const infoVille =
        document.getElementById("infoVille");

    const infoDate =
        document.getElementById("infoDate");


    /* Photo */

    photo.src = voyage.photo;
    photo.hidden = false;


    /* Tampon */

    tamponDate.textContent =
        formaterDate(voyage.date);

    tampon.hidden = false;


    /* Informations */

    infoPays.textContent = voyage.pays;

    infoVille.textContent = voyage.ville;

    infoDate.textContent =
        formaterDate(voyage.date);

    infos.hidden = false;
}
        
