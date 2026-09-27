# Radio Télé Unita FM

Site statique de la station, compatible avec GitHub Pages. Aucun serveur applicatif, installation ou compilation nécessaire.

## Interface

- Univers bleu nuit et citron, sphère animée en Canvas et illustrations en CSS.
- Interface responsive, menu mobile, liens accessibles au clavier.
- Lecteur principal et lecteur fixe synchronisés avec un seul élément audio.
- Gestion des connexions lentes (20 secondes), erreurs, pause, nouvelle tentative, volume et sourdine.
- Français, kreyòl et anglais, sans rechargement ni coupure lors du changement de langue.
- Réduction des animations et respect du réglage système. Animation suspendue hors écran ou lorsque l’onglet est masqué.
- Logo officiel, photo de Beauzile Hibert, coordonnées et contenus spirituels conservés.

## Fichiers

- `index.html` : structure et contenus en français.
- `styles.css` : interface, illustrations et adaptations aux écrans.
- `app.js` : lecteur audio, navigation, langues et sphère.
- `translations.js` : textes anglais et créoles.
- `privacy.html` : politique de confidentialité de l’application existante.
- `assets/` : logo officiel et photo du fondateur.

## Aperçu et publication

Servir le dossier avec un serveur HTTP statique, par exemple `python -m http.server 4173`, puis ouvrir `http://localhost:4173`.

GitHub Pages peut publier la racine de la branche `main`. Les liens de ressources sont relatifs pour fonctionner aussi sous `/radio-tele-unita-fm/`.

## Configuration

Le flux reste `https://stream.zeno.fm/qqpqyfuzresvv`, dans l’attribut `src` de l’élément `audio`. L’écoute démarre après une action de l’utilisateur. Les animations d’égaliseur indiquent l’état de lecture ; elles ne mesurent pas le signal audio.

Les préférences de langue et d’animation sont enregistrées localement dans le navigateur. Le site reste utilisable si ce stockage est bloqué. Les polices DM Sans et Space Grotesk sont chargées depuis Google Fonts, avec une police de secours. Le flux audio est fourni par Zeno.

Contact officiel : Beauzile Hibert — +1 (336) 433-3495 — beauzilehibert0@gmail.com.

## Vérifications réalisées

- Direct Zeno lu dans le navigateur ; pause via le lecteur fixe.
- Français → anglais → créole → français sans interruption du direct.
- Affichage à 320, 390 et 1440 pixels ; pas de débordement horizontal constaté.
- Menu mobile, ancres internes et images vérifiés.
- Tests du contrôleur audio : erreur persistante, nouvelle tentative, volume, sourdine, annulation pendant la connexion et délai de connexion.

La disponibilité du direct dépend du service de diffusion de la station.
