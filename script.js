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

                const photoCompressee =
                    canvas.toDataURL(
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
   FORMAT DATE JJ/MM/AAAA
===================================================== */

function formaterDate(date) {

    if (!date) return "";

    /* Si date stockée en AAAA-MM-JJ */

    if (date.includes("-")) {

        const morceaux = date.split("-");

        if (morceaux.length === 3) {

            return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
        }
    }

    return date;
}


/* =====================================================
   CONVERSION JJ/MM/AAAA → AAAA-MM-JJ
===================================================== */

function convertirDate(date) {

    const morceaux = date.split("/");

    if (morceaux.length !== 3) {
        return null;
    }

    const jour = morceaux[0];
    const mois = morceaux[1];
    const annee = morceaux[2];

    if (
        jour.length !== 2 ||
        mois.length !== 2 ||
        annee.length !== 4
    ) {
        return null;
    }

    return `${annee}-${mois}-${jour}`;
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
   PAGE AJOUTER
===================================================== */

const formulaire =
    document.querySelector(".formulaire-voyage");

if (formulaire) {

    const champPays =
        document.getElementById("pays");

    const champVille =
        document.getElementById("ville");

    const champDate =
        document.getElementById("date");

    const champPhoto =
        document.getElementById("photo");

    const boutonEnregistrer =
        document.getElementById("enregistrer");


    /* -------------------------------------------------
       DATE AU CLAVIER
    ------------------------------------------------- */

    if (champDate) {

        champDate.addEventListener("input", () => {

            let chiffres = champDate.value
                .replace(/\D/g, "")
                .slice(0, 8);

            let valeur = "";

            if (chiffres.length > 0) {

                valeur += chiffres.slice(0, 2);
            }

            if (chiffres.length >= 3) {

                valeur += "/" +
                    chiffres.slice(2, 4);
            }

            if (chiffres.length >= 5) {

                valeur += "/" +
                    chiffres.slice(4, 8);
            }

            champDate.value = valeur;
        });
    }


    /* -------------------------------------------------
       APERÇU PHOTO
    ------------------------------------------------- */

    if (champPhoto) {

        champPhoto.addEventListener("change", () => {

            const fichier =
                champPhoto.files[0];

            if (!fichier) return;

            const cadrePhoto =
                document.querySelector(".cadre-photo");

            if (!cadrePhoto) return;


            let image =
                cadrePhoto.querySelector(
                    ".apercu-image"
                );


            if (!image) {

                image =
                    document.createElement("img");

                image.className =
                    "apercu-image";

                cadrePhoto.appendChild(image);
            }


            /*
               Aperçu immédiat de la photo originale.
               La compression sera faite lors
               de l'enregistrement.
            */

            image.src =
                URL.createObjectURL(fichier);
        });
    }


    /* -------------------------------------------------
       ENREGISTREMENT
    ------------------------------------------------- */

    if (boutonEnregistrer) {

        boutonEnregistrer.addEventListener(
            "click",
            async () => {

                const pays =
                    champPays.value.trim();

                const ville =
                    champVille.value.trim();

                const dateTexte =
                    champDate.value.trim();

                const fichier =
                    champPhoto.files[0];


                /* Vérifications */

                if (
                    !pays ||
                    !ville ||
                    !dateTexte ||
                    !fichier
                ) {

                    alert(
                        "Merci de compléter tous les champs."
                    );

                    return;
                }


                const date =
                    convertirDate(dateTexte);


                if (!date) {

                    alert(
                        "La date doit être au format JJ/MM/AAAA."
                    );

                    return;
                }


                boutonEnregistrer.disabled = true;

                boutonEnregistrer.textContent =
                    "Enregistrement...";


                try {

                    /*
                       Compression automatique
                    */

                    const photo =
                        await compresserPhoto(fichier);


                    const voyages =
                        getVoyages();


                    const nouveauVoyage = {

                        id: Date.now(),

                        pays: pays,

                        ville: ville,

                        date: date,

                        photo: photo
                    };


                    voyages.push(
                        nouveauVoyage
                    );


                    saveVoyages(voyages);


                    /*
                       Retour vers Mes voyages
                    */

                    window.location.href =
                        "mes-voyages.html";


                } catch (erreur) {

                    console.error(erreur);

                    alert(
                        "Impossible de traiter la photo."
                    );


                    boutonEnregistrer.disabled =
                        false;

                    boutonEnregistrer.textContent =
                        "Enregistrer le voyage";
                }
            }
        );
    }
}


/* =====================================================
   PAGE MES VOYAGES
===================================================== */

const listeVoyages =
    document.querySelector(".liste-voyages");

if (listeVoyages) {

    afficherVoyages();
}


function afficherVoyages() {

    const voyages =
        getVoyages();

    listeVoyages.innerHTML = "";


    /*
       Plus récent → plus ancien
    */

    voyages.sort((a, b) => {

        return new Date(b.date) -
               new Date(a.date);

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

        const carte =
            document.createElement("div");

        carte.className =
            "carte-voyage";


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
   PAGE ACCUEIL
===================================================== */

const prochainVoyage =
    document.getElementById(
        "prochainVoyage"
    );

if (prochainVoyage) {

    afficherProchainVoyage();
}


function afficherProchainVoyage() {

    const voyages =
        getVoyages();


    if (voyages.length === 0) {

        return;
    }


    const aujourdHui =
        new Date();

    aujourdHui.setHours(
        0,
        0,
        0,
        0
    );


    /*
       Voyages aujourd'hui ou futurs
    */

    const voyagesAVenir =
        voyages
            .filter(voyage => {

                const dateVoyage =
                    new Date(
                        voyage.date +
                        "T00:00:00"
                    );

                return dateVoyage >=
                    aujourdHui;
            })
            .sort((a, b) => {

                return new Date(
                    a.date + "T00:00:00"
                ) -
                new Date(
                    b.date + "T00:00:00"
                );
            });


    /*
       S'il reste des voyages à venir,
       le plus proche est affiché.
    */

    if (voyagesAVenir.length > 0) {

        afficherVoyageAccueil(
            voyagesAVenir[0]
        );

        return;
    }


    /*
       Tous les voyages sont passés :
       on affiche le plus récent.
    */

    voyages.sort((a, b) => {

        return new Date(
            b.date + "T00:00:00"
        ) -
        new Date(
            a.date + "T00:00:00"
        );
    });


    afficherVoyageAccueil(
        voyages[0]
    );
}


/* =====================================================
   AFFICHAGE VOYAGE ACCUEIL
===================================================== */

function afficherVoyageAccueil(voyage) {

    const photo =
        document.getElementById(
            "photoProchainVoyage"
        );

    const tampon =
        document.getElementById(
            "tamponVoyage"
        );

    const tamponDate =
        document.getElementById(
            "tamponDate"
        );

    const infos =
        document.getElementById(
            "infosProchainVoyage"
        );

    const infoPays =
        document.getElementById(
            "infoPays"
        );

    const infoVille =
        document.getElementById(
            "infoVille"
        );

    const infoDate =
        document.getElementById(
            "infoDate"
        );


    /* Photo */

    photo.src =
        voyage.photo;

    photo.hidden =
        false;


    /* Tampon */

    tamponDate.textContent =
        formaterDate(
            voyage.date
        );

    tampon.hidden =
        false;


    /* Informations */

    infoPays.textContent =
        voyage.pays;

    infoVille.textContent =
        voyage.ville;

    infoDate.textContent =
        formaterDate(
            voyage.date
        );

    infos.hidden =
        false;
          }
