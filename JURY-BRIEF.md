# BRIEF D'ÉVALUATION — VVS Flow
### Lovable Challenge 2026 · Document destiné aux jurys (humains ou IA) — tout y est décrit de A à Z

---

## 0. Carte d'identité & accès

| | |
|---|---|
| **Projet** | VVS Flow — Autonomous Dispatch & Priority Waitlist Platform |
| **Client fictif** | Ekström VVS AB — plombier solo, Västerås, Suède (Mats Ekström, est. 1994) |
| **App en ligne (publique)** | https://b9506bcd-256a-4188-834f-9981db88d72f.lovableproject.com — s'ouvre sans compte ; les liens `id-preview--…lovable.app` sont des previews Lovable qui exigent une connexion et ne doivent pas être partagés |
| **Repo GitHub (public)** | https://github.com/mohalr2007/vvs-flow.git |
| **Connexion jury** | Ouvrir `/login` → bouton **« ✦ Accès Jury & Démo — Sans mot de passe »** → connexion instantanée au dashboard owner complet (compte démo provisionné automatiquement : `mats.demo@vvsflow.local`, rôle owner) |
| **Visite guidée** | `/demo` — scénarios guidés + le brief client + les stats d'impact |
| **Stack** | TanStack Start (React 19) · Supabase (PostgreSQL + RLS) · Tailwind v4 · Nitro/Vercel · OpenStreetMap/Nominatim/OSRM · Leaflet · Lovable AI Gateway |

**Aucune inscription, aucune clé, aucun setup n'est nécessaire pour évaluer.**

---

## 1. Le problème business (pourquoi ce projet existe)

Mats est plombier **solo** : il fait le travail ET gère le business, sans secrétaire.
- **Mar–Jeu 9h–16h : toujours complet.** Lun/Ven ont des trous.
- **~1 no-show par semaine** — chaque trou coûte **2 200–3 400 SEK**.
- **4–6 clients attendent toujours un créneau** — sans que personne ne sache que les autres existent.
- **2–3 demandes perdues par semaine**, enterrées dans des threads WhatsApp.
- La **déduction fiscale ROT suédoise** (30–50 % de remboursement pour les clients) = paperasse manuelle.

> Devise du projet : *« Every inquiry gets an outcome. No valuable plumbing job gets silently lost. »*

**La réponse :** un intake IA structuré → des créneaux réalistes calculés sur la route réelle → confirmation + portail client + rappels → et surtout : **chaque annulation est automatiquement revendue au meilleur client de la waitlist en 30 minutes, sans un seul appel téléphonique.**

---

## 2. Parcours jury recommandé (~10 minutes, le flux héros inclus)

1. **`/`** → « Repair / Emergency » → décrire le problème en une phrase → **l'IA extrait** titre, urgence, durée, fourchette de prix, confiance (visible à l'écran).
2. Étape adresse : chercher une adresse, épingler sur la carte (ou GPS) → badge **« In service area »** (Västerås + 40 km).
3. **Choix des créneaux** : chaque créneau affiche le **temps de route OSRM réel** (« Best fit with Mats's route », « Estimated drive: X min from the previous job »). Un créneau est marqué **Recommended**.
4. Confirmation → **vrai e-mail de confirmation** (réf. + lien portail personnel `/access/:token`).
5. **`/login` → accès jury 1 clic → `/dashboard`** : le RDV apparaît dans Overview + Calendar.
6. **LE FLUX HÉROS** : dans Calendar ou Jobs → **annuler ce RDV**. Le système trouve instantanément le meilleur client de la waitlist et lui envoie une **offre par e-mail avec compte à rebours de 30 min** (liens privés `/offer/:token`).
7. Ouvrir le lien de l'offre → renseigner **l'adresse d'intervention** (épinglage carte ou texte — la réservation la portera, Mats saura exactement où aller) → **Accept** → l'offre est verrouillée, le créneau passe au statut **confirmed** pour ce client avec son adresse, l'ancien créneau annulé **disparaît de l'agenda**, et le owner voit la réservation récupérée. Zéro intervention manuelle.
8. **`/dashboard/waitlist`** : les entrées scorées, les offres en cours avec compte à rebours, les slots libérés.
9. Bonus owner : **Inbox** (colle un e-mail client brut → l'IA le structure → 1 clic → job), **Leads** (suivi), **Projects** (chantiers multi-jours avec planification + devis), **ROT** (registre fiscal), **Settings** (horloge démo +15 min/+24h, reset démo, purge des RDV, e-mail de test).

> Si aucun créneau n'est disponible côté client, le tunnel propose de **rejoindre la Priority Waitlist** en un clic.

---

## 3. Fonctionnalités — côté client (CustomerShell)

| Page | Contenu |
|---|---|
| `/` (Book) | Tunnel 4 étapes : service → description (intake IA) → détails + adresse (carte) + photo + méthode d'accès → créneaux (route-aware) → confirmation. Repli automatique vers la waitlist. |
| `/emergency` | Flux séparé : carte de localisation, **ETA d'arrivée ~35 min** (arrondi 5 min), confirmation e-mail immédiate. Fonctionne hors heures ouvrées, par design. |
| `/access/:token` | Portail client : voir le RDV, déclarer **comment Mats entrera** (à la maison / clé chez le voisin / code porte / à organiser), lien reschedule. |
| `/reschedule/:token` | Nouveaux créneaux **revalidés route-aware** ; l'ancien créneau reste bloqué jusqu'à confirmation. Garde anti-conflit avec rollback si collision concurrente. |
| `/offer/:token` | Offre prioritaire : anneau de compte à rebours 30 min, **adresse d'intervention obligatoire à l'acceptation** (pin carte ou texte, gate 40 km — écrite dans la réservation), Accept / Decline. Expirée → « le slot passe au suivant, tu restes en waitlist ». |
| `/waitlist` | Inscription waitlist : urgence, flexibilité, adresse (gate 40 km), e-mail de confirmation. |
| `/demo` | Guide jury : scénarios, brief client, stats d'impact (0 appels, 3 min par réservation, 30 min pour remplir un créneau annulé, 100 % des demandes trackées). |

**Formulaire toujours vierge** à chaque ouverture (reset explicite `EMPTY_FORM`/`EMPTY_LOC` au mount) — jamais de données d'une réservation précédente.

---

## 4. Fonctionnalités — côté owner (`/dashboard`, OwnerShell)

- **Overview** : compteurs temps réel (à revoir, évaluations, accès, **slots ouverts à récupérer**, projets, abandons), revenu à risque en SEK, capacité restante du jour, **premier slot ouvert**.
- **Calendar** : agenda 7 jours, RDV + tâches de chantier, buffers de trajet, annulation → **déclenche la cascade waitlist automatiquement**.
- **Jobs** : pipeline (new → qualified → confirmed → in_progress → completed), détails client, photo du problème, planification, statuts. Compléter un job génère la fiche **ROT**.
- **Waitlist** : entrées scorées avec **explication du score** (breakdown détaillé), offres en cours avec countdown, offres manuelles au candidat choisi, réservation directe, suppression, purge.
- **Leads** : New → Qualified → Held → Abandoned → Converted.
- **Projects** : flux 8 étapes (demande → visite → review → approbation → planifié → en cours → terminé), planification multi-jours (jours de repos, jours de retard), **devis complet** (matériaux, main-d'œuvre, acompte, échéances).
- **Inbox** : coller un message client brut → l'IA le structure → 1 clic → job créé (confiance < 60 % → évaluation humaine obligatoire).
- **ROT** : registre des déductions fiscales (Review → Ready → Exported) — labor 70 % / materials 30 % de la valeur du job.
- **Settings** : horaires, jours de repos, **route & day planning** (point de départ/fin de journée : bureau/domicile/custom + buffer), **horloge démo** (+15 min / +24 h) pour tester les expirations en direct, reset démo, purge RDV, **e-mail de test**.

---

## 5. Le flux héros — cascade waitlist (détail technique exact)

1. **Annulation** (`setJobStatus → cancelled`) → si le créneau est futur, le backend appelle immédiatement `cascadeWaitlistOffer()`.
2. **Gardes en amont** : le créneau n'est pas repris par un job actif (check d'overlap), pas d'offre déjà en cours sur ce slot, créneau à plus de 2 min.
3. **Sélection déterministe** (`scoreMatch` — voir §7) : les candidats `waiting` non déjà contactés pour ce slot sont scorés ; seuls ceux dont la **durée rentre** dans le créneau sont éligibles.
4. **Offre 30 min** : `expires_at = maintenant + 30 min`, **plafonné pour ne jamais dépasser le début du créneau**. E-mail avec lien privé `/offer/:token`.
5. **Expiration / refus** — évaluée à chaque lecture de page, **sans cron** : le compte à rebours de la page d'offre rafraîchit lui-même la requête à zéro (déclenchant l'expiration et la cascade en direct), et le dashboard owner revérifie à chaque ouverture — donc aucune action manuelle du owner n'est jamais requise. Le candidat expire → repasse `waiting`, **le candidat suivant est automatiquement contacté**. Personne d'éligible → le slot reste ouvert, visible au owner dans Overview (« open slots » + revenu à risque).
6. **Acceptation** : saisie de **l'adresse d'intervention** (pin carte ou texte, gate 40 km, géocodage serveur) → vérification que le créneau n'a pas été repris entre-temps → **claim atomique** de l'offre (`pending → accepted` en une requête conditionnelle) → **récupération en place** : la ligne du RDV annulé devient elle-même le rendez-vous confirmé du candidat **avec son adresse et ses coordonnées** (nouveau token d'accès — l'ancien lien client expire) → garde anti-course post-écriture avec **rollback par snapshot complet** si un conflit survient → e-mail de confirmation au client.
7. **Résultat visible** : le créneau disparaît des « slots ouverts », l'agenda affiche la réservation confirmée, l'entrée waitlist passe `booked`. **Zéro clic owner de bout en bout.**

---

## 6. Route Intelligence (OSRM) — pourquoi chaque créneau est réaliste

- **Géocodage** : OpenStreetMap/Nominatim — adresse épinglée OU tapée (géocodée **côté serveur**), stockée lat/lng.
- **Gate service area** : haversine, **Västerås + 40 km**, appliqué au picker (client), aux créneaux, à la réservation et à la waitlist (serveur).
- **Matrice OSRM** (`/table`) : temps de route réels entre client, point de début de journée, point de fin, et chaque job du jour.
- **Faisabilité** (`routeFeasibility`) : un créneau n'est valide que si *fin du job précédent + trajet entrant + buffer ≤ début* ET *fin + trajet sortant + buffer ≤ début du suivant*. Trajet incalculable → créneau **jamais** proposé.
- **Score de route** (`routeScore`, plus bas = mieux) : `trajet_in + trajet_out + idle/4 + jour×25` → les 5 meilleurs créneaux espacés d'≥ 90 min, le meilleur marqué **Recommended**.
- **Revalidation backend au clic final** (`createBooking`) : re-résolution des coordonnées (pin ou géocodage), re-check de faisabilité route **+ double contrôle de collision** (`slotTaken` + `conflictAfterInsert` où le dernier écrivain recule). Un créneau périmé ou pris en parallèle **ne peut jamais être validé**.
- Le buffer fixe de 20 min n'est qu'un **fallback de dernier recours** (géocodage/OSRM injoignable) — jamais le chemin principal.

---

## 7. Scoring waitlist — déterministe, expliqué, zéro IA dans la décision

`score = zone + durée + flexibilité + attente + urgence` (max 92), décompte affiché au owner :

| Composante | Barème |
|---|---|
| Proximité zone | même zone **40** · adjacente **28** · ≤ 3 zones **15** · loin **0** |
| Durée | rentre **30** · ne rentre pas → **non éligible** |
| Flexibilité | Flexible **15** · Fixed **5** · autre **10** |
| Attente | **1 pt/jour** (max 5) |
| Urgence | High/Emergency **2** · Normal **1** · Low **0** |

> **Positionnement IA assumé :** l'IA (Lovable AI Gateway, sortie structurée Zod) fait l'**intake** (titre, urgence, durée, prix, champs manquants, confiance) et l'analyse de la Inbox — mais **aucune décision de scheduling n'est IA**. Le scoring est pur, déterministe (`src/lib/scheduling.ts`), reproductible et expliqué. « Zero AI hallucination » = zéro IA dans les décisions, pas zéro IA dans le produit.

---

## 8. Architecture & sécurité

```
src/
├── figma/pages/         # UI double expérience (client vs owner, shells distincts)
├── routes/              # Routing type-safe TanStack (pages token : /access, /offer, /reschedule)
├── lib/
│   ├── scheduling.ts    # Logique PURE (findSlots, scoreMatch, routeFeasibility, jobOverlaps)
│   ├── route.server.ts  # Matrice OSRM → créneaux réalistes
│   ├── location.server.ts # Nominatim + haversine 40 km + OSRM
│   ├── public.functions.ts # Endpoints client : validés Zod, scopés par token 32-hex
│   ├── owner.functions.ts  # Endpoints owner : rôle vérifié (has_role) à chaque appel
│   ├── email.server.ts  # Double moteur EmailJS → Resend, 6+ templates HTML
│   └── ai.server.ts     # Intake IA structurée (gateway Lovable)
└── integrations/supabase/  # Client admin serveur, middleware auth, types DB
```

- **Base** : `settings` (1 ligne : horaires, horloge démo, config route), `jobs` (11 statuts), `waitlist_entries`, `offers` (token, expires_at, score, breakdown jsonb), `projects` + `project_tasks` + devis jsonb, `leads`, `rot_records`, `inbox_messages`, `user_roles`.
- **RLS Supabase** : le client n'accède **jamais** aux tables ; lectures/écritures uniquement via server functions. Owner = rôle unique réclamable une seule fois (`has_role`). Endpoints client scopés par **tokens 32-hex non devinables** (portails /access, /offer, /reschedule).
- **Anti double-réservation en profondeur** : pré-check + garde atomique post-insertion (le dernier écrivain recule) + garde anti-course avec rollback sur les acceptations d'offre et les reschedules.
- **Horloge démo** : offset minutes dans `settings`, utilisée partout (expirations, rappels, ETAs) — évaluée **au read**, aucun cron.
- **Secrets** : `.env` jamais commité (retiré du tracking, `.gitignore`, `.env.example` fourni sans valeurs) ; la clé EmailJS historiquement exposée a été retirée du README et doit être **rotée** au dashboard du provider.
- **Design** : système Figma marine/cyan, Fraunces + Outfit + JetBrains Mono, light/dark persistant via **View Transitions API** (fallback instantané reduced-motion), pas de 3D — photo authentique.

---

## 9. E-mails transactionnels (réels)

Double moteur : **EmailJS** (gratuit, 200 e-mails/mois) avec bascule automatique vers **Resend** si configuré. Modèles HTML responsive : confirmation de réservation (avec portail + checklist d'accès pour les RDV à ≥ 24 h), **offre prioritaire 30 min**, confirmation d'urgence (ETA), demande de projet, confirmation waitlist, **avis d'arrivée du technicien** pour les RDV du jour (< 2 h), e-mail de test owner.

> **Dégradation gracieuse (quota épuisé, provider down)** : chaque envoi est `.catch(() => null)` — **aucun flux métier ne casse** ; seul l'e-mail manque. Réservations, offres, cascade et récupération continuent de fonctionner.

---

## 10. Edge cases — couverts et testables

| Cas | Comportement |
|---|---|
| Créneau déjà pris | Refus clair sur /book (« That time is already booked »), /reschedule (rollback vers l'ancien horaire), /offer (« le créneau vient d'être repris, ta priorité waitlist est conservée ») |
| Offre expirée | Statut évalué au read → candidat repasse `waiting` → cascade auto au suivant |
| Client hors 40 km | Blocage explicite (sélection, créneaux, réservation, waitlist) avec invitation à appeler |
| Token invalide/expiré | Pages dédiées « This link isn't valid. » sur /access, /offer, /reschedule |
| Annulation pendant une offre | Offres chevauchant le créneau re-réservé annulées, candidats restitués à la waitlist |
| Waitlist sans candidat éligible | Cascade s'arrête proprement ; slot reste visible au owner |
| Urgence hors horaires | ETA ~35 min, autorisée par design à toute heure |
| Reschedule vers créneau devenu indisponible | Revalidation faisabilité + garde de course avec rollback |
| Double réservation concurrente | Garde atomique : le dernier écrivain recule (`conflictAfterInsert`) |
| E-mail/OSRM indisponible | Fallback zone puis dernier recours 20 min ; flux jamais bloqués |

---

## 11. Limites connues (transparence)

- L'expiration des offres et la cascade sont évaluées **à la lecture des pages** (la page d'offre se rafraîchit à zéro, le dashboard owner revérifie à l'ouverture) : aucun cron ne tourne en tâche de fond — si personne n'ouvre aucune page, le slot reste en attente jusqu'au prochain affichage.
- Quota EmailJS gratuit (200/mois) : adapté à la démo, pas à la production (Resend en alternative déjà intégré).
- Temps de route OSRM sans trafic temps réel (estimation). E-mails et interface en anglais (produit présenté à un jury international).

---

## 12. Alignement avec les critères du Lovable Challenge

- **Problem-solving** : le cœur du brief — annulation → créneau perdu → **revente automatique confirmée** — est implémenté de bout en bout, atomique et testable en 2 clics par le jury.
- **Owner-effort reduction** : 0 appel téléphonique sur tout le cycle (intake IA → créneaux → confirmation + rappel d'accès → cascade d'annulation → ROT) ; le dashboard expose ce qui nécessite un jugement humain (confiance < 60 %, slots non récupérables).
- **Craft** : logique de scheduling **pure et testable**, sécurité en profondeur (RLS + tokens + guards atomiques), design system Figma cohérent, View Transitions, deux expériences client/owner distinctes, page `/demo` pensée pour le jury.
- **Fit au challenge** : petite activité, un seul owner, ville réelle (Västerås), scoring transparent et quirks crédibles issus du métier.

*Projet créé pour le Lovable Challenge 2026 par Larabi Mohamed. Deadline : 1er octobre 2026, 23:59 PDT.*
