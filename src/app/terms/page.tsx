"use client";

import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#181818] text-gray-200 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block"
        >
          &larr; Retour
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">
          Conditions generales d&apos;utilisation
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Derniere mise a jour : 13 mai 2025
        </p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Objet
            </h2>
            <p>
              Les presentes conditions generales d&apos;utilisation (CGU) regissent
              l&apos;acces et l&apos;utilisation du service Gigflow, accessible a
              l&apos;adresse{" "}
              <a
                href="https://www.gigflow.online"
                className="text-purple-400 hover:underline"
              >
                www.gigflow.online
              </a>
              . Gigflow est une plateforme de gestion de bookings pour
              l&apos;industrie musicale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Acceptation des CGU
            </h2>
            <p>
              En creant un compte sur Gigflow, vous acceptez sans reserve les
              presentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne
              devez pas utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Description du service
            </h2>
            <p>Gigflow propose les fonctionnalites suivantes :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Gestion de bookings (dates, lieux, cachets, transports, hotels)
              </li>
              <li>Gestion d&apos;agences de booking avec roles (booker, artiste)</li>
              <li>Formulaires d&apos;advancing pour la collecte d&apos;informations aupres des promoteurs</li>
              <li>Gestion de contacts promoteurs partagee au sein d&apos;une agence</li>
              <li>
                Synchronisation optionnelle avec Google Calendar
              </li>
              <li>Vues tableau et calendrier des evenements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Inscription et compte
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                L&apos;inscription est gratuite et peut se faire par email/mot de
                passe ou via Google OAuth
              </li>
              <li>
                Vous etes responsable de la confidentialite de vos identifiants
              </li>
              <li>
                Les informations fournies doivent etre exactes et a jour
              </li>
              <li>
                Chaque utilisateur choisit un role (artiste ou booker) lors de
                l&apos;inscription
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Utilisation du service
            </h2>
            <p>Vous vous engagez a :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Utiliser le service conformement a sa finalite</li>
              <li>
                Ne pas tenter de compromettre la securite ou le fonctionnement de
                la plateforme
              </li>
              <li>
                Ne pas utiliser le service a des fins illegales ou non autorisees
              </li>
              <li>Respecter les droits des autres utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Donnees et propriete
            </h2>
            <p>
              Vous restez proprietaire des donnees que vous saisissez sur
              Gigflow (bookings, contacts, fichiers). Gigflow ne revendique aucun
              droit de propriete sur vos contenus.
            </p>
            <p className="mt-2">
              Pour le traitement de vos donnees personnelles, veuillez consulter
              notre{" "}
              <Link
                href="/privacy-policy"
                className="text-purple-400 hover:underline"
              >
                Politique de confidentialite
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Google Calendar
            </h2>
            <p>
              La synchronisation avec Google Calendar est optionnelle et
              necessite votre consentement explicite. Gigflow accede a votre
              calendrier en lecture et ecriture pour y ajouter vos evenements de
              booking. Vous pouvez revoquer cet acces a tout moment depuis les
              parametres de votre compte ou depuis votre compte Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Agences et partage de donnees
            </h2>
            <p>
              Les bookers travaillent au sein d&apos;agences. En rejoignant une
              agence, vous acceptez que les informations de bookings et de
              promoteurs soient partagees avec les autres membres de l&apos;agence.
              Le proprietaire de l&apos;agence peut retirer des membres a tout
              moment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Responsabilite
            </h2>
            <p>
              Gigflow est fourni &quot;tel quel&quot;. Nous mettons tout en oeuvre pour
              assurer la disponibilite et la securite du service, mais ne
              garantissons pas une disponibilite ininterrompue. Gigflow ne
              saurait etre tenu responsable de toute perte de donnees ou
              d&apos;interruption de service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Resiliation
            </h2>
            <p>
              Vous pouvez supprimer votre compte a tout moment. Gigflow se
              reserve le droit de suspendre ou supprimer un compte en cas de
              violation des presentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Modifications des CGU
            </h2>
            <p>
              Gigflow se reserve le droit de modifier les presentes CGU. En cas
              de modification substantielle, les utilisateurs seront informes par
              email ou via l&apos;application. La poursuite de l&apos;utilisation du
              service apres modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Droit applicable
            </h2>
            <p>
              Les presentes CGU sont soumises au droit francais. Tout litige
              relatif a l&apos;utilisation de Gigflow sera soumis aux tribunaux
              competents de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Contact
            </h2>
            <p>
              Pour toute question relative aux presentes CGU, contactez-nous a{" "}
              <a
                href="mailto:contact@gigflow.online"
                className="text-purple-400 hover:underline"
              >
                contact@gigflow.online
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
